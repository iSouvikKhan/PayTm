import logo from "../assets/logo.png";
import logo2 from "../assets/logo2.svg";
import { Dropdown } from "./Dropdown";
import { useState } from "react";

export const Appbar = () => {

    const [dropdown, setDropdown] = useState(false);

    return (
        <>
            <div className="flex justify-center">
                <div className="w-8/12 flex justify-between items-center py-4 border-b-2 border-sky-200">
                    <img src={logo2} alt="PayTm logo" />
                    <div className="flex justify-center items-center space-x-3 pr-4 relative">
                        <p className="text-xl">Hi</p>
                        <div className="h-12 w-12 bg-slate-200 rounded-full flex justify-center items-center text-xl cursor-pointer" onClick={() => setDropdown((visible) => !visible)}>
                            S
                        </div>
                        {dropdown && <Dropdown/>}
                    </div>
                </div>
            </div>
        </>
    )
}
