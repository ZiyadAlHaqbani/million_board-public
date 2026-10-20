import { GameObjects, Scene, Types } from "phaser";

interface ClippedRect{
    x0 : number,
    y0 : number,
    x1 : number,
    y1 : number,

};

export class GridHandler {
  static GetClippingFrustum(
    camera: Phaser.Cameras.Scene2D.Camera,
    grids: Array<Uint32Array>
  ) : {x: number, y: number, width: number, height: number} | undefined {
    const frustum = camera.worldView;

    const top_left = { x: frustum.x, y: frustum.y };
    const width = frustum.width;
    const height = frustum.height;

    const CELL_SIZE = (256/3);
    const clipped_frustum = this.getClippedRect(
        {width: 729, height: 729},
        frustum.x / CELL_SIZE,
        frustum.y / CELL_SIZE,
        frustum.width / CELL_SIZE,
        frustum.height / CELL_SIZE,
    );

    // camera outside the play area
    if(clipped_frustum == undefined){
        return;
    }

    return {
        x: clipped_frustum.x0,
        y: clipped_frustum.y0,
        width: clipped_frustum.x0 - clipped_frustum.x1,
        height: clipped_frustum.y0 - clipped_frustum.y1,
    };
  }

  private static getClippedRect(
    frustum : {width: number, height: number},
    x: number,
    y: number,
    w: number,
    h: number
  ): ClippedRect | undefined {
    // return if a passed number is NaN/Infinity.
    if (![x, y, w, h].every(Number.isFinite)) return;

    if (w == 0 || h == 0) return;

    // find the top-left and bottom-right points of the rect, supports negative sizes.
    let x0 = x;
    let y0 = y;
    let x1 = x + w;
    let y1 = y + h;

    if (x1 < x0) [x0, x1] = [x1, x0];
    if (y1 < y0) [y0, y1] = [y1, y0];

    // convert to integers
    // the end points(x1, y1) represent the non-inclusive end of range for the rect.
    x0 = Math.floor(x0);
    y0 = Math.floor(y0);
    x1 = Math.ceil(x1);
    y1 = Math.ceil(y1);

    // second check to see if final rect is empty.
    if (x0 >= x1 || y0 >= y1) return;

    // if the rect is outside the buffer, return;
    if (x1 <= 0 || y1 <= 0 || x0 >= frustum.width || y0 >= frustum.height) return;

    // clip the valid part of the rect.
    x0 = Math.max(0, Math.min(frustum.width, x0));
    y0 = Math.max(0, Math.min(frustum.height, y0));
    x1 = Math.max(0, Math.min(frustum.width, x1));
    y1 = Math.max(0, Math.min(frustum.height, y1));

    return { x0, y0, x1, y1 };
  }
}
