
export const Balance = ({ value }) => {
    return <div className="flex justify-end font-semibold mt-8">
        <div className=" text-lg">
            My balance:
        </div>
        <div className="ml-3 text-lg">
            {value} INR
        </div>
    </div>
}