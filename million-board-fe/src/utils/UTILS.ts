
export class UTILS{
    static nearlyEqual(a : number, b : number, theta : number = 1e-9) : boolean{
        return Math.abs(a - b) <= theta;
    }

    static fmtString(value : number) : string{
        return value.toFixed(3).padEnd(6);
    }
}