import { Request, Response, NextFunction } from "express";

export const checkAuthorization = (...roles: string[]) => {

    return (
        req: Request,
        res: Response,
        next: NextFunction

    ): void => {

        const user = (req as any).user;
        if (!roles.includes(user.role)) {
            res.status(403).json({
                success: false,
                message: "Forbidden"
            });
            return;
        }
        next();
    };
};