import nextConnect from 'next-connect';
import multer from 'multer';
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { uploadToS3 } from '@/lib/s3'; 
import { parseSbomFile } from '@/lib/sbom/parser';
import { saveSbomScan } from '@/lib/db/sbom';
import { runOsvLookupForPackages } from '@/lib/cve/osv';

const upload= multer ({dest:'/tmp/sbomos'});
const handler =nextConnect({onError(err: any, req:any, res:NextApiRsponse){
    console.error(err);
    res.status(500).json({error:'Internal Server Error'});
},});
handler.use(upload.single('sobmfile'));
handler.post(async(req:any, res:NextApiResponse)=>{
    try{
        const file =req.file;
        if(!file)return res.status(400).json({error:'no file'});
        const s3result =await uploadToS3(file.path,{
            key:`sbom/${Date.now()}_${file.originalname}`,
            contentType: file.mimetype,
        });
        const sbom =await parseSbomFile(file.path);
        const vulnResults=await runOsvLookupForPackages(sbom.packages);
        const saved =await saveSbomScan({
            filename:file.originalname,
            s3url:s3result.Location,
            packages:sbom.packages,
            vulnerabilities:vulnResults,
        });
        try {fs.unlinkSync(file.path);} catch(err){console.warn('Failed to delete temp file', err);}
        res.status(200).json({ok:true, scanId:saved.id, vulnerabilities:vulnResults.length});
    }catch(err){
        console.error(err);
        res.status(500).json({error:'blep'});
    }
});
export const POST=handler;
export const config ={
    api:{
        bodyParser:false,
    },
};