import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom";

export const Dropdown = () => {
    const navigate = useNavigate();

    return (
        <>
            <div className="absolute top-20 right-0 flex flex-col bg-white h-20 w-24">
                <div className="flex-1 flex items-center justify-center hover:bg-gray-200 cursor-pointer">
                    <p>Profile</p>
                </div>
                <div className="flex-1 flex items-center justify-center hover:bg-gray-200 cursor-pointer" onClick={() => {
                    localStorage.removeItem("token");
                    navigate("/signin");
                }}>
                    <p>Logout</p>
                </div>
            </div>
        </>
    )
}


// flex box

{/* <div className="flex bg-gray-100 h-20 w-64">
  <div className="flex-1 flex items-center justify-center hover:bg-gray-200 cursor-pointer">
    <p>Option 1</p>
  </div>
  <div className="flex-1 flex items-center justify-center hover:bg-gray-200 cursor-pointer">
    <p>Option 2</p>
  </div>
</div> */}


// grid

{/* <div className="grid grid-cols-2 bg-gray-100 h-20 w-64">
  <div className="flex items-center justify-center hover:bg-gray-200 cursor-pointer">
    <p>Option 1</p>
  </div>
  <div className="flex items-center justify-center hover:bg-gray-200 cursor-pointer">
    <p>Option 2</p>
  </div>
</div> */}
