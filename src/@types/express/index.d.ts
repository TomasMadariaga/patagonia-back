import * as express from "express"

declare global {
    namespace Express {
        interface Request {
          tokenExpired?: boolean;
          user?: Partial<User>;
        }
    }
}