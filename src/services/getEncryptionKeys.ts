// Utility to safely get from sessionStorage
const getSessionItem = (key: string): string | null => {
    const value = sessionStorage.getItem(key);
    return value ? value : null;
};

export const getAesEncryptionKey = async (dispatch: any, initiate: any): Promise<string | null> => {
    let keyHex: string | null = sessionStorage.getItem("key");

    if (!keyHex) {
        try {
            const result = await dispatch(initiate()).unwrap();

            const aesEncryptionKey = result?.data?.key;

            if (aesEncryptionKey) {
                sessionStorage.setItem("key", aesEncryptionKey);
                keyHex = aesEncryptionKey;
            }

        } catch (error) {
            console.error(error);
            return null;
        }
    }

    return keyHex;
};

export const getRsaPublicKey = async (dispatch: any, initiate: any): Promise<string | null> => {
    let rsaEncryptionKey: string | null = getSessionItem("publicKey");

    if (!rsaEncryptionKey) {
        try {
            const result = await dispatch(initiate()).unwrap();

            const key = result?.data?.key;

            if (key) {
                sessionStorage.setItem("publicKey", key);
                rsaEncryptionKey = key;
            }

        } catch (error) {
            console.error(error);
            return null;
        }
    }

    return rsaEncryptionKey;
};