'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConnect } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

// --- STILI E CONFIGURAZIONE ---
const THEME = {
  primary: '#835fb3',
  primaryDark: '#6a4ca0',
  background: '#1a1025',
  cardBg: '#2d1b4e',
  text: '#ffffff',
  textSecondary: '#d8b4fe',
  success: '#4ade80',
  successBg: '#14532d',
  border: '#4c2f7a',
  opensea: '#2081e2',
  share: '#10b981',
  debugInput: '#4a044e',
};

const CHAD_NFT_CONTRACT_ADDRESS = '0xfBA99D39eB89B1927f09C410fC33661bd31fC720';

const CHAD_NFT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'string', name: 'uri', type: 'string' },
      { internalType: 'uint256', name: 'fid', type: 'uint256' },
    ],
    name: 'safeMint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

enum ProcessState {
  INITIAL = 'INITIAL',
  FETCHING_FID = 'FETCHING_FID',
  FETCHING_PFP = 'FETCHING_PFP',
  TRANSFORMING = 'TRANSFORMING',
  UPLOADING_IPFS = 'UPLOADING_IPFS',
  MINT_READY = 'MINT_READY',
  MINTING = 'MINTING',
  MINT_SUCCESS = 'MINT_SUCCESS',
}

interface UserData {
  address: `0x${string}`;
  fid: number;
  pfpUrl: string;
  displayName?: string;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const { data: hash, writeContract, error: mintError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isTxSuccessful } = useWaitForTransactionReceipt({ hash });

  const [processState, setProcessState] = useState<ProcessState>(ProcessState.INITIAL);
  const [error, setError] = useState<string | null>(null);

  const [fid, setFid] = useState<number | null>(null);
  const [fidLoading, setFidLoading] = useState(false);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [chadImage, setChadImage] = useState<string | null>(null);
  const [metadataUri, setMetadataUri] = useState<string | null>(null);
  const [traits, setTraits] = useState<any[]>([]);

  useEffect(() => {
    if (isTxSuccessful) setProcessState(ProcessState.MINT_SUCCESS);
  }, [isTxSuccessful]);

  useEffect(() => {
    if (mintError) {
      setError(`Errore Mint: ${mintError.message.substring(0, 80)}...`);
      setProcessState(ProcessState.MINT_READY);
    }
  }, [mintError]);

  // --- AUTO: fetch FID dall'indirizzo wallet ---
  useEffect(() => {
    const run = async () => {
      if (!address || !isConnected) {
        setFid(null);
        setUserData(null);
        return;
      }

      setError(null);
      setFidLoading(true);
      setProcessState(ProcessState.FETCHING_FID);

      try {
        const res = await fetch(`/api/get-fid?address=${address}`);
        const data = await res.json();

        const foundFid = typeof data?.fid === 'number' ? data.fid : null
        setFid(foundFid)

        if (!foundFid) {
          setError("couldn't find a farcaster fid for this wallet")
          setProcessState(ProcessState.INITIAL)
          return
        }

        setUserData({
          address: address as `0x${string}`,
          fid: foundFid,
          pfpUrl: data?.pfpUrl || 'https://placehold.co/50x50/png',
          displayName: data?.username ? `@${data.username}` : `fid-${foundFid}`,
        })


        setProcessState(ProcessState.INITIAL);
      } catch (e: any) {
        setFid(null);
        setUserData(null);
        setError('failed to fetch fid from wallet');
        setProcessState(ProcessState.INITIAL);
      } finally {
        setFidLoading(false);
      }
    };

    run();
  }, [address, isConnected]);

  const handleConnect = useCallback(() => {
    const coinbaseConnector = connectors.find((c) => c.id === 'coinbaseWalletSDK');
    const metamaskConnector = connectors.find((c) => c.name.toLowerCase().includes('metamask'));
    const injectedConnector = connectors.find((c) => c.id === 'injected');

    if (coinbaseConnector) connect({ connector: coinbaseConnector });
    else if (metamaskConnector) connect({ connector: metamaskConnector });
    else if (injectedConnector) connect({ connector: injectedConnector });
    else {
      if (connectors.length > 0) connect({ connector: connectors[0] });
      else alert('Nessun wallet trovato.');
    }
  }, [connectors, connect]);

  const handleCreateChad = async () => {
    const wallet = address as `0x${string}`;

    if (!wallet) {
      setError('collega il wallet per iniziare');
      return;
    }
    if (!fid) {
      setError("couldn't find your farcaster id for this wallet");
      return;
    }

    setError(null);

    try {
      // A. Recupero PFP
      setProcessState(ProcessState.FETCHING_PFP);
      let currentPfp: string | null = null;

      try {
        const res = await fetch(`/api/get-pfp?fid=${fid}`);
        const data = await res.json();
        if (data?.pfpUrl) currentPfp = data.pfpUrl;
      } catch (e) {
        console.log('Errore PFP API', e);
      }

      if (!currentPfp) currentPfp = 'https://placehold.co/400x400/png?text=NO+PFP';

      setUserData({
        address: wallet,
        fid,
        pfpUrl: currentPfp,
        displayName: `fid-${fid}`,
      });

      // B. AI Transformation
      setProcessState(ProcessState.TRANSFORMING);
      const aiRes = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pfpUrl: currentPfp, fid }),
      });
      const aiData = await aiRes.json();
      if (!aiData?.imageUrl) throw new Error('Errore generazione AI');

      setChadImage(aiData.imageUrl);
      setTraits(aiData.attributes || []);

      // C. Upload IPFS
      setProcessState(ProcessState.UPLOADING_IPFS);
      const ipfsRes = await fetch('/api/upload-to-ipfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: aiData.imageUrl,
          name: `Chad #${fid}`,
          description: 'Generated by Farchad App',
          fid,
          attributes: aiData.attributes,
        }),
      });
      const ipfsData = await ipfsRes.json();
      if (!ipfsData?.metadataUri) throw new Error('Errore IPFS');

      setMetadataUri(ipfsData.metadataUri);
      setProcessState(ProcessState.MINT_READY);
    } catch (e: any) {
      setError(e?.message || 'Errore sconosciuto');
      setProcessState(ProcessState.INITIAL);
    }
  };

  const handleMint = () => {
    if (!metadataUri || !userData) return;

    setProcessState(ProcessState.MINTING);

    writeContract({
      address: CHAD_NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: CHAD_NFT_ABI,
      functionName: 'safeMint',
      args: [userData.address, metadataUri, BigInt(userData.fid)],
      chainId: baseSepolia.id,
    });
  };

  const isUserConnected = isConnected;

  const displayImage =
    chadImage || userData?.pfpUrl || 'https://placehold.co/400x400/2d1b4e/835fb3/png?text=?';

  const createDisabled = fidLoading || !fid;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>MINT FARCHAD</h1>
        <p style={styles.subtitle}>Create your unique CHAD-style NFT 🐵</p>
        <div style={styles.statsBadge}>LIVE ON BASE SEPOLIA 🔵</div>
      </div>

      <div style={styles.mainCard}>
        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        {isUserConnected ? (
          <div style={styles.profileCard}>
            <div style={styles.profileHeader}>YOUR PROFILE</div>
            <div style={styles.profileContent}>
              <img
                src={userData?.pfpUrl || 'https://placehold.co/50x50/png'}
                style={styles.profileImage}
                alt="Profile"
              />
              <div style={styles.profileInfo}>
                <div style={styles.username}>
                  {fid ? `fid-${fid}` : address ? `${address.slice(0, 6)}...` : 'User'}
                </div>
                <div style={styles.statusText}>
                  {fidLoading ? 'detecting farcaster id...' : fid ? 'connected' : 'connected (no fid)'}
                </div>
              </div>
              <div style={styles.checkIcon}>✓</div>
            </div>
          </div>
        ) : (
          <div style={{ ...styles.profileCard, opacity: 0.5 }}>
            <div style={styles.profileHeader}>YOUR PROFILE</div>
            <div style={{ padding: '15px', textAlign: 'center', color: THEME.textSecondary }}>
              Connect wallet to start
            </div>
          </div>
        )}

        <div style={styles.previewContainer}>
          {processState === ProcessState.TRANSFORMING ||
          processState === ProcessState.UPLOADING_IPFS ||
          processState === ProcessState.FETCHING_PFP ||
          processState === ProcessState.FETCHING_FID ? (
            <div style={styles.placeholderBox}>
              <div style={styles.loadingText}>
                {processState === ProcessState.FETCHING_FID && 'GETTING FID...'}
                {processState === ProcessState.FETCHING_PFP && 'GETTING PFP...'}
                {processState === ProcessState.TRANSFORMING && 'GENERATING CHAD AI...'}
                {processState === ProcessState.UPLOADING_IPFS && 'SAVING TO IPFS...'}
              </div>
            </div>
          ) : (
            <img src={displayImage} style={styles.previewImage} alt="Preview" />
          )}

          {chadImage &&
            traits.some((t) => t.trait_type === 'Rarity' && (t.value === 'RARE' || t.value === 'LEGENDARY')) && (
              <div style={styles.rarityBadge}>✨ RARE TRAIT FOUND!</div>
            )}
        </div>

        <div style={styles.actionsArea}>
          {!isUserConnected ? (
            <button onClick={handleConnect} style={styles.primaryButton}>
              CONNECT WALLET
            </button>
          ) : processState === ProcessState.INITIAL ? (
            <button
              onClick={handleCreateChad}
              disabled={createDisabled}
              style={{ ...styles.primaryButton, opacity: createDisabled ? 0.6 : 1 }}
            >
              {fidLoading ? 'LOADING...' : !fid ? 'NO FID FOUND' : 'CREATE CHAD AI'}
            </button>
          ) : processState === ProcessState.MINT_READY ? (
            <button onClick={handleMint} style={styles.primaryButton}>
              MINT NFT NOW
            </button>
          ) : processState === ProcessState.MINTING || isConfirming ? (
            <button disabled style={{ ...styles.primaryButton, opacity: 0.7 }}>
              MINTING...
            </button>
          ) : processState === ProcessState.MINT_SUCCESS ? (
            <div style={styles.successContainer}>
              <div style={styles.successBadge}>✓ MINTED!</div>
              <button
                onClick={() =>
                  window.open(
                    `https://warpcast.com/~/compose?text=I%20am%20a%20Chad!&embeds[]=https://zora.co/collect/base:${CHAD_NFT_CONTRACT_ADDRESS}`,
                    '_blank'
                  )
                }
                style={styles.shareButton}
              >
                SHARE
              </button>
              <button
                onClick={() =>
                  window.open(
                    `https://testnets.opensea.io/assets/base-sepolia/${CHAD_NFT_CONTRACT_ADDRESS}`,
                    '_blank'
                  )
                }
                style={styles.openseaButton}
              >
                OPENSEA
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: THEME.background,
    color: THEME.text,
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
  },
  header: { textAlign: 'center', marginBottom: '30px', maxWidth: '600px' },
  title: { fontSize: '3rem', fontWeight: '900', color: THEME.primary, margin: '0 0 10px 0', textTransform: 'uppercase' },
  subtitle: { color: '#ccc', fontSize: '1rem', marginBottom: '20px' },
  statsBadge: {
    display: 'inline-block',
    backgroundColor: '#3e2c16',
    border: `2px solid ${THEME.primary}`,
    color: '#fbbf24',
    padding: '8px 20px',
    borderRadius: '20px',
    fontWeight: 'bold',
  },
  mainCard: { width: '100%', maxWidth: '400px', backgroundColor: '#251830', border: `4px solid ${THEME.border}`, borderRadius: '20px', padding: '20px' },
  profileCard: { backgroundColor: THEME.cardBg, border: `2px solid ${THEME.primary}`, borderRadius: '12px', padding: '12px', marginBottom: '20px', position: 'relative' },
  profileHeader: { fontWeight: 'bold', color: '#fbbf24', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '10px' },
  profileContent: { display: 'flex', alignItems: 'center', gap: '15px' },
  profileImage: { width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #fff', objectFit: 'cover' },
  profileInfo: { display: 'flex', flexDirection: 'column' },
  username: { fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' },
  statusText: { fontSize: '0.8rem', color: THEME.textSecondary },
  checkIcon: { marginLeft: 'auto', backgroundColor: THEME.primary, color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' },
  previewContainer: { width: '100%', aspectRatio: '1 / 1', backgroundColor: '#000', borderRadius: '12px', border: `4px solid ${THEME.border}`, overflow: 'hidden', marginBottom: '20px', position: 'relative' },
  previewImage: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholderBox: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1025' },
  loadingText: { color: THEME.primary, fontWeight: 'bold', fontSize: '1.2rem' },
  actionsArea: { display: 'flex', flexDirection: 'column', gap: '10px' },
  primaryButton: { width: '100%', padding: '16px', backgroundColor: THEME.primary, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer' },
  successContainer: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' },
  successBadge: { backgroundColor: THEME.successBg, color: THEME.success, border: `2px solid ${THEME.success}`, padding: '12px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold' },
  shareButton: { width: '100%', padding: '14px', backgroundColor: THEME.share, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  openseaButton: { width: '100%', padding: '14px', backgroundColor: THEME.opensea, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  errorBox: { backgroundColor: '#7f1d1d', color: '#fecaca', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #ef4444', fontSize: '0.9rem' },
  rarityBadge: { position: 'absolute', top: '10px', right: '10px', backgroundColor: '#fbbf24', color: '#000', padding: '5px 10px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' },
};
