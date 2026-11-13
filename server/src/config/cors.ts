import { CorsOptions } from "cors"
import { env } from "./env"

export const orsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || env.CORS_ORIGINS.includes(origin)) {
      callback(null, true)
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATH", "DELETE", "OPTIONS"]
}