import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

interface UseAppwriteOptions<T> {
    fn: () => Promise<T>;
    skip?: boolean;
    dependencies?: any[]; // ✅ Ajouter les dépendances
    showErrorAlert?: boolean; // ✅ Option pour désactiver les alertes
}

const useAppwrite = <T,>({ 
    fn, 
    skip = false, 
    dependencies = [], // ✅ Par défaut tableau vide
    showErrorAlert = true 
}: UseAppwriteOptions<T>) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(!skip);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);  
        } else {
            setLoading(true);    
        }
        setError(null);

        try {
            const result = await fn();
            setData(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
            setError(errorMessage);
            console.error('❌ Erreur useAppwrite:', errorMessage);
            
            // ✅ Seulement afficher l'alerte si demandé
            if (showErrorAlert) {
                Alert.alert("Erreur", errorMessage);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);  
        }
    }, [fn, showErrorAlert]);
    
    // ✅ Recharger quand les dépendances changent
    useEffect(() => {
        if (!skip) {
            fetchData(false);  
        }
    }, [...dependencies, skip]); // ✅ Inclure skip aussi

    const refetch = useCallback(() => fetchData(true), [fetchData]);  

    return { data, loading, refreshing, error, refetch };  
};

export default useAppwrite;