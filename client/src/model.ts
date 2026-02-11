class user {
    id: string;
    name: string;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}

class session {
    id?: string;
    user: user;
    token?: string;

    constructor(user: user, id?: string, token?: string) {
        this.user = user;
        this.id = id;
        this.token = token;
    }
}

export { user, session };