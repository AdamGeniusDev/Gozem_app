import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

interface UseAppwriteOptions<T> {
    fn: () => Promise<T>;
    skip?: boolean;
}

const useAppwrite = <T,>({ fn, skip = false }: UseAppwriteOptions<T>) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(!skip);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await fn();
            setData(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
            setError(errorMessage);
            Alert.alert("Erreur", errorMessage);
        } finally {
            setLoading(false);
        }
    }, [fn]);  

    useEffect(() => {
        if (!skip) {
            fetchData();
        }
    }, []);  

    return { data, loading, error, refetch: fetchData };
};

export default useAppwrite;