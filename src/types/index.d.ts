declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userEmail?: string;
    userName?: string;
    authenticated?: boolean;
    passport?: {
      user?: string;
    };
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

  interface SessionOptions {
    secret?: string | string[];
    resave?: boolean;
    saveUninitialized?: boolean;
    store?: any;
    cookie?: any;
    name?: string;
    [key: string]: any;
  }

  function session(options?: SessionOptions): any;

  namespace session {
    interface Store {
      get(sid: string, callback: (err: any, session?: Session) => void): void;
      set(sid: string, session: Session, callback?: (err?: any) => void): void;
      destroy(sid: string, callback?: (err?: any) => void): void;
      clear(callback?: (err?: any) => void): void;
      length(callback: (err: any, length?: number) => void): void;
      all(callback: (err: any, obj?: any) => void): void;
    }

    const Store: {
      new (): Store;
    };
  }

  export = session;
}


declare module 'connect-session-sequelize' {
  interface SequelizeStoreOptions {
    db: any;
    table?: string;
    checkExpirationInterval?: number;
    expiration?: number;
    extendDefaultFields?: (defaults: any, session: any) => any;
  }

  class SequelizeStore {
    constructor(options: SequelizeStoreOptions);
    sync(): Promise<void>;
    startExpiringSessions(): void;
    stopExpiringSessions(): void;
  }

  function connectSessionSequelize(SessionStore: any): typeof SequelizeStore;

  export = connectSessionSequelize;
}



