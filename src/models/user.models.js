import mongoose,{Schema} from 'mongoose'

const userSchema=new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowerCase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowerCase:true,
            trim:true
        },
        fullName:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String, //cloudinary or aws URL
            required:true
        },
        coverImage:{
            type:String, //cloudinary or aws URL
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"password is required"]
        },
        refreshToken:{
            type:String
        }
    },
    {
        timestamps:true
    }
)

export const User=mongoose.model("User",userSchema);