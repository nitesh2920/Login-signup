const jwt=require("jsonwebtoken")

const secret="Nitesh@1234"

function setUser(user){
    return jwt.sign({
        _id:user._id,
        email:user.email,
    },secret)
}

function getUser(token){
    if(!token) return NULL;
    try{
        return jwt.verify(token,secret)
    }catch(error){
        console.error("Invalid token")
        return null;
    }
  
}

module.exports={
    setUser,
    getUser
    
}