import { currentUser } from "@clerk/nextjs/dist/types/server"

export const checkUser = async()=>{
    const user = await currentUser();

    console.log(user);
}