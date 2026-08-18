/* eslint-disable react-refresh/only-export-components */
import { createContext,useState,useEffect } from "react";
import { getMe } from "./services/auth.api";


export const AuthContext = createContext()


export const AuthProvider = ({ children }) => { 

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getAndSetUser = async () => {
            const token = localStorage.getItem("token")
            if (!token) {
                setUser(null)
                setLoading(false)
                return
            }
            try {
                const data = await getMe()
                setUser(data.user)
            } catch {
                localStorage.removeItem("token")
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        getAndSetUser()
    }, [])


    return (
        <AuthContext.Provider value={{user,setUser,loading,setLoading}} >
            {children}
        </AuthContext.Provider>
    )

    
}