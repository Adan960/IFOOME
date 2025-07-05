//import jwt from 'jsonwebtoken';

//const jwtSecret: string = process.env.JWT_SECRET || "";

function adminAuth(req: any, res: any, next: any): void {
    next();
}

export default adminAuth;