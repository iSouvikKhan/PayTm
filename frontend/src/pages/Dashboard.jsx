import { useEffect } from "react"
import { Appbar } from "../components/Appbar"
import { Balance } from "../components/Balance"
import { Users } from "../components/Users"
import { useNavigate } from "react-router-dom"

export const Dashboard = () => {

    const navigate = useNavigate();
    useEffect(() => {
        if (!localStorage.getItem("token")) {
            navigate("/signin");
        }
    })
    return (
        <>
            <div className="bg-[#e0f5fd] min-h-screen">
                <Appbar />
                <div className="flex justify-center">
                    <div className="w-8/12">
                        <Balance value={"10,000"} />
                        <Users />
                    </div>
                </div>
            </div>
        </>
    )
}