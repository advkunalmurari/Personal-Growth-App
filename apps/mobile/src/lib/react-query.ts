import { QueryClient } from '@tanstack/react-query';
import { MMKV } from 'react-native-mmkv';

// @ts-ignore
export const mmkvStorage = new MMKV();

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 2,
        },
    },
});

export const mmkvPersister = {
    persistClient: async (client: any) => {
        mmkvStorage.set('REACT_QUERY_CACHE', JSON.stringify(client));
    },
    restoreClient: async () => {
        const cache = mmkvStorage.getString('REACT_QUERY_CACHE');
        if (!cache) return undefined;
        return JSON.parse(cache) as any;
    },
    removeClient: async () => {
        mmkvStorage.delete('REACT_QUERY_CACHE');
    },
};
