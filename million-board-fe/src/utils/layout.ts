
// all sizes are in CSS pixels
const buttonWidth = 48;
const buttonHeight = 36;

export class LAYOUT{

    em_dash! : number;

    public Init(dim?: {width: number, height: number}){

        const em = document.createElement('div');
        em.style = 'display: flex; position: absolute; width: 1em';

        document.removeChild(em);

        window.devicePixelRatio;
    }

}