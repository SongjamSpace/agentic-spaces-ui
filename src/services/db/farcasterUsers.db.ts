import { db } from '../firebase.service';
import {
    doc,
    getDoc,
    setDoc,
    query,
    where,
    collection,
    getDocs,
} from 'firebase/firestore';

export interface FarcasterUser {
    fid: number;
    username: string;
    displayName?: string;
    pfpUrl?: string;
    custodyAddress: string;
    followerCount: number;
    followingCount: number;
    verifications?: string[];
    xUsername?: string;
    createdAt: number;
    updatedAt: number;
}

const FARCASTER_USERS_COLLECTION = 'farcaster_users';

/**
 * Create or update a Farcaster user document
 * Uses fid as the document ID
 */
export async function createOrUpdateFarcasterUser(
    userData: {
        fid: number;
        username: string;
        display_name?: string;
        pfp_url?: string;
        custody_address: string;
        follower_count: number;
        following_count: number;
        verifications?: string[];
        verified_accounts?: Array<{
            platform: 'x' | 'instagram' | 'tiktok' | string;
            username: string;
        }>;
    }
): Promise<FarcasterUser> {
    try {
        const fidString = userData.fid.toString();
        const docRef = doc(db, FARCASTER_USERS_COLLECTION, fidString);
        const existingDoc = await getDoc(docRef);

        const now = Date.now();
        
        // Extract X username from verified accounts
        const xUsername = userData.verified_accounts?.find(
            acc => acc.platform === 'x'
        )?.username;

        // Build the document, filtering out undefined values
        const farcasterUserDoc: Record<string, any> = {
            fid: userData.fid,
            username: userData.username,
            custodyAddress: userData.custody_address,
            followerCount: userData.follower_count || 0,
            followingCount: userData.following_count || 0,
            createdAt: existingDoc.exists() ? existingDoc.data().createdAt : now,
            updatedAt: now,
        };

        // Only add optional fields if they have values
        if (userData.display_name) {
            farcasterUserDoc.displayName = userData.display_name;
        }
        if (userData.pfp_url) {
            farcasterUserDoc.pfpUrl = userData.pfp_url;
        }
        if (userData.verifications && userData.verifications.length > 0) {
            farcasterUserDoc.verifications = userData.verifications;
        }
        if (xUsername) {
            farcasterUserDoc.xUsername = xUsername;
        }

        await setDoc(docRef, farcasterUserDoc);

        return farcasterUserDoc as FarcasterUser;
    } catch (error) {
        console.error('Error creating/updating Farcaster user:', error);
        throw new Error('Failed to create/update Farcaster user');
    }
}

/**
 * Get a Farcaster user document by FID
 */
export async function getFarcasterUserByFid(
    fid: number
): Promise<FarcasterUser | null> {
    try {
        const fidString = fid.toString();
        const docRef = doc(db, FARCASTER_USERS_COLLECTION, fidString);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return docSnap.data() as FarcasterUser;
    } catch (error) {
        console.error('Error getting Farcaster user by FID:', error);
        throw new Error('Failed to get Farcaster user by FID');
    }
}

/**
 * Get a Farcaster user by username
 */
export async function getFarcasterUserByUsername(
    username: string
): Promise<FarcasterUser | null> {
    try {
        const q = query(
            collection(db, FARCASTER_USERS_COLLECTION),
            where('username', '==', username)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        return querySnapshot.docs[0].data() as FarcasterUser;
    } catch (error) {
        console.error('Error getting Farcaster user by username:', error);
        throw new Error('Failed to get Farcaster user by username');
    }
}
