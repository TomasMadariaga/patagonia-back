import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";


export class JwtStrategy extends PassportStrategy(Strategy, 'jwt'){
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([ 
        (req) => req.cookies.token,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.SECRET
    })
  }

  async validate(payload: any) {
    return {id: payload.id, name: payload.name, email: payload.email, role: payload.role}
  }
}