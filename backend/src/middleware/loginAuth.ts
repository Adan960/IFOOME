const regex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function loginAuth (req: any, res: any, next: any): Promise<void> {
    if(req.body && typeof(req.body.email) == "string" && typeof(req.body.password) == "string") {
        if(regex.test(req.body.email)) {
            next();
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(412);
    }
}