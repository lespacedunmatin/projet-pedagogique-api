// Extension des types Express pour inclure les sessions
declare global {
  namespace Express {
    interface Request {
      session: Session;
    }
  }
}

interface Session {
  userId?: string;
  userEmail?: string;
  userName?: string;
  authenticated?: boolean;
  passport?: {
    user?: string;
  };
  [key: string]: any;
}

export {};
