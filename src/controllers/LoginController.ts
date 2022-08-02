import { Request, Response } from "express";
import  AppDataSource  from "../database/data-source";
import {User} from "../database/entity/User";
import bcrypt from "bcrypt";
import * as yup from "yup";
import jwt from "jsonwebtoken";

export default class LoginController{

public static async index(req: Request, res: Response){

    let schema = yup.object().shape({
        firstName: yup.string().required(),
        lastName: yup.string().required(),
        age: yup.number().required(),
        email: yup.string().required(),
        password: yup.string().required(),
    });
    
    const validated = await schema.validate(req.body).catch((err)=>{
        return res.status(400).json({message: err})
    })


    const passwordHash = await bcrypt.hash(req.body.password, 5).then( hash => hash);

        try{
            const userRepository = AppDataSource.getRepository(User);
            if(validated){
                const created = await userRepository.save({...req.body, password: passwordHash});
                if(created){
                    return res.status(201).json({message: "Usuário criado"});
                }
            }
        }catch(err){
            return res.status(500).json({message: err})
        }
}

public static async login(req: Request, response: Response){

    let schema = yup.object().shape({
        email: yup.string().required(),
        password: yup.string().required(),
    });
    
    await schema.validate(req.body).catch((err)=>{
        return response.status(400).json({message: err})
    });

    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOneBy({email: req.body.email});


    if(!user){
        return response.status(400).json({message: "Email inválido"});
    }else{
        bcrypt.compare(req.body.password, user.password, (err, res)=>{
            if(err){
                return console.log("erro ao comparar a senha");
            }
            if(!res){
                return response.status(401).json({message: "Senha incorreta."})
            }
        });
    }

    const token = jwt.sign({id: user?.id}, "67f10ff0835d698ff77d46054c29ca91")

    return response.status(200).json({username: user.firstName, token});
    
}

}