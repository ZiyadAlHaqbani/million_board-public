import { World } from "matter";
import { GameObjects, Scene, Types } from "phaser";
import { UTILS } from "../../utils/UTILS";
import { GridHandler } from "../../utils/gridHandler";
import { ServerMock } from "../../mocks/serverMock";

const holdThreshold: number = 500;

export class FirstPage extends Scene {
  private cursors : Types.Input.Keyboard.CursorKeys;

  private HUD_cam! : Phaser.Cameras.Scene2D.Camera;
  private text! : GameObjects.Text;
  private START_TIME : number;

  private debugGfx! : GameObjects.Graphics;

  private shader! : GameObjects.Shader;
  private backgroundShader! : GameObjects.Shader;
  private cellShader! : GameObjects.Shader;

  
  private updatingTextures = false;
  private cellTexture_0! : Phaser.Textures.CanvasTexture;
  private tmpImage_0 : ImageData;
  private cellTexture_1! : Phaser.Textures.CanvasTexture;
  private tmpImage_1 : ImageData;
  private cellTexture_2! : Phaser.Textures.CanvasTexture;
  private tmpImage_2 : ImageData;
  private cellTexture_3! : Phaser.Textures.CanvasTexture;
  private tmpImage_3 : ImageData;
  private cellTexture_4! : Phaser.Textures.CanvasTexture;
  private tmpImage_4 : ImageData;
  private cellTexture_5! : Phaser.Textures.CanvasTexture;
  private tmpImage_5 : ImageData;
  

  private visibleArea? : {x: number, y: number, width: number, height: number};
  
  private activeCell = new Phaser.Math.Vector2();
  private zoomSeeking : boolean = false;
  private cellLevel : number = 0;

  button_pressed : boolean = false;

  game_size_exp = 6;

  game_size : number;
  grid_0! : Uint32Array;
  grid_1! : Uint32Array;
  grid_2! : Uint32Array;
  grid_3! : Uint32Array;
  grid_4! : Uint32Array;
  grid_5! : Uint32Array;

  grids: Array<Uint32Array>;

//   3rd party sources
    server! : ServerMock;
    currentUser! : string;
    user_1!: string;
    user_2!: string;

  constructor() {
    super("FirstPage");
    this.START_TIME = Date.now();

    // simulate connecting to backend
    this.server = new ServerMock();
    this.user_1 = this.server.registerNewPlayer();
    this.user_2 = this.server.registerNewPlayer();

    if(!this.server.loginPlayer(this.user_1)){
        console.log("couldn't sign user in!");
        throw new Error("couldn't sign user in!");
    }
    if(!this.server.loginPlayer(this.user_2)){
        console.log("couldn't sign user in!");
        throw new Error("couldn't sign user in!");
    }

    this.currentUser = this.user_1;

    console.log(`user_1: ${this.user_1}`);
    console.log(`user_2: ${this.user_2}`);
    console.log(`user_1 team: ${this.server.loginPlayer(this.user_1).team?.toString()}`);
    console.log(`user_2 team: ${this.server.loginPlayer(this.user_2).team?.toString()}`);
    
  }

  private unpackResponse(response: {cells: Uint8Array, frustum: {x: number, y: number, width: number, height: number}}): Uint8Array {
    const totalCells = response.frustum.width * response.frustum.height;
    const unpackedCells = new Uint8Array(totalCells);
    const packedData = response.cells;
    
    let cellIndex = 0;

    // 1. Process the bulk of the data (Full Quadruplets)
    // We iterate through the packed bytes. Each byte contains 4 cells.
    const fullBytes = Math.floor(totalCells / 4);
    
    for (let i = 0; i < fullBytes; i++) {
        const byte = packedData[i];

        // Manually unrolling the 4 cells for pipelining/speed
        // Masking with 0b11 (3) to get the 2-bit value
        unpackedCells[cellIndex++] = (byte >> 0) & 3;
        unpackedCells[cellIndex++] = (byte >> 2) & 3;
        unpackedCells[cellIndex++] = (byte >> 4) & 3;
        unpackedCells[cellIndex++] = (byte >> 6) & 3;
    }

    // 2. Handle leftover cells (Remainder)
    // If totalCells % 4 != 0, there is one last byte in response.cells 
    // that is only partially filled.
    if (cellIndex < totalCells) {
        const lastByte = packedData[fullBytes];
        let shift = 0;
        while (cellIndex < totalCells) {
            unpackedCells[cellIndex++] = (lastByte >> shift) & 3;
            shift += 2;
        }
    }

    return unpackedCells;
}

  private CopyGridToTexture(){

    // to prevent two update attempts at the same time;
    if(this.updatingTextures){
        return;
    }
    this.updatingTextures = true;

    
    if(this.visibleArea == undefined){
        console.log("empty frustum!");
        this.updatingTextures = false;
        return;
    };

    let clippedFrustum = {x: this.visibleArea.x, y: this.visibleArea.y, width: -this.visibleArea.width, height: -this.visibleArea.height};
    // this.randomizeGrid(this.grid_0, 729, clippedFrustum);
    // clippedFrustum.x/=3;clippedFrustum.y/=3;clippedFrustum.width/=3;clippedFrustum.height/=3;
    // this.randomizeGrid(this.grid_1, 243, clippedFrustum);
    // clippedFrustum.x/=3;clippedFrustum.y/=3;clippedFrustum.width/=3;clippedFrustum.height/=3;
    // this.randomizeGrid(this.grid_2, 81,  clippedFrustum);
    // clippedFrustum.x/=3;clippedFrustum.y/=3;clippedFrustum.width/=3;clippedFrustum.height/=3;
    // this.randomizeGrid(this.grid_3, 27,  clippedFrustum);
    // clippedFrustum.x/=3;clippedFrustum.y/=3;clippedFrustum.width/=3;clippedFrustum.height/=3;
    // this.randomizeGrid(this.grid_4, 9,   clippedFrustum);
    // clippedFrustum.x/=3;clippedFrustum.y/=3;clippedFrustum.width/=3;clippedFrustum.height/=3;
    // this.randomizeGrid(this.grid_5, 3,   clippedFrustum);

    // const update_section = this.server.getUpdatedGrid(this.currentUser, clippedFrustum);
    // const frustum = clippedFrustum;
    const packed_update_section = this.server.getUpdatedGrid_BitPacked(this.currentUser, clippedFrustum)!;
    const update_section = this.unpackResponse(packed_update_section);
    const frustum = packed_update_section?.frustum;
    if(update_section == undefined){
        console.log("FAILED TO UPDATE!");
        this.updatingTextures = false;
        return;
    }

    const resp_idx = (x: number, y: number) => (y * clippedFrustum.width + x);
    const world_idx = (x: number, y: number) => (y + clippedFrustum.y) * 729 + (x + clippedFrustum.x);

    for (let i = 0; i < frustum.height; i++) {
        for (let j = 0; j < frustum.width; j++) {
            const newCell = update_section[resp_idx(j, i)];
            let color : number = 0;
            if(newCell == 1){
                color = 0XE00000FF;
            }else if(newCell == 2){
                color = 0XE0FF0000;
            }

            this.grid_0[world_idx(j, i)] = color;
        }   
    }

    const ctx_0 = this.cellTexture_0.context;
    const data_0 = new Uint32Array(this.tmpImage_0.data.buffer);
    data_0.set(this.grid_0);
    ctx_0.putImageData(this.tmpImage_0, 0, 0);
    this.cellTexture_0.refresh();
    
    const ctx_1 = this.cellTexture_1.context;
    const data_1 = new Uint32Array(this.tmpImage_1.data.buffer);
    data_1.set(this.grid_1);
    ctx_1.putImageData(this.tmpImage_1, 0, 0);
    this.cellTexture_1.refresh();
    
    const ctx_2 = this.cellTexture_2.context;
    const data_2 = new Uint32Array(this.tmpImage_2.data.buffer);
    data_2.set(this.grid_2);
    ctx_2.putImageData(this.tmpImage_2, 0, 0);
    this.cellTexture_2.refresh();
    
    const ctx_3 = this.cellTexture_3.context;
    const data_3 = new Uint32Array(this.tmpImage_3.data.buffer);
    data_3.set(this.grid_3);
    ctx_3.putImageData(this.tmpImage_3, 0, 0);
    this.cellTexture_3.refresh();

    const ctx_4 = this.cellTexture_4.context;
    const data_4 = new Uint32Array(this.tmpImage_4.data.buffer);
    data_4.set(this.grid_4);
    ctx_4.putImageData(this.tmpImage_4, 0, 0);
    this.cellTexture_4.refresh();
    
    const ctx_5 = this.cellTexture_5.context;
    const data_5 = new Uint32Array(this.tmpImage_5.data.buffer);
    data_5.set(this.grid_5);
    ctx_5.putImageData(this.tmpImage_5, 0, 0);
    this.cellTexture_5.refresh();

    this.updatingTextures = false;
    console.log("finished updating texture!");
  }

  preload() {
    this.load.image("bg", "/assets/bg.png");
    this.load.image("grid", "/assets/gridTexture.png");
    this.load.glsl('bundle', '/assets/example.glsl.js');

    this.game_size = 3 ** this.game_size_exp;
    this.grid_0 = new Uint32Array(this.game_size           ** 2);
    this.grid_1 = new Uint32Array((this.game_size /   3.0) ** 2);
    this.grid_2 = new Uint32Array((this.game_size /   9.0) ** 2);
    this.grid_3 = new Uint32Array((this.game_size /  27.0) ** 2);
    this.grid_4 = new Uint32Array((this.game_size /  81.0) ** 2);
    this.grid_5 = new Uint32Array((this.game_size / 243.0) ** 2);

    this.grids = new Array<Uint32Array>(6);
    this.grids.push(this.grid_0);
    this.grids.push(this.grid_1);
    this.grids.push(this.grid_2);
    this.grids.push(this.grid_3);
    this.grids.push(this.grid_4);
    this.grids.push(this.grid_5);

    console.log(`created game with side length: ${this.game_size} and cell count: ${this.grid_0.length}`);
    console.log(`preload() done at: ${Date.now() - this.START_TIME}`);
  }

  create() {

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.HUD_cam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.HUD_cam.ignore(this.children.list);
    
    this.cellTexture_0 = this.textures.createCanvas('cellTexture_0', 729, 729)!;
    const tex_0 = this.textures.get('cellTexture_0');
    tex_0.setFilter(Phaser.Textures.NEAREST);
    this.tmpImage_0 = this.cellTexture_0.context.createImageData(729, 729);
    
    this.cellTexture_1 = this.textures.createCanvas('cellTexture_1', 243, 243)!;
    const tex_1 = this.textures.get('cellTexture_1');
    tex_1.setFilter(Phaser.Textures.NEAREST);
    this.tmpImage_1 = this.cellTexture_1.context.createImageData(243, 243);
    
    this.cellTexture_2 = this.textures.createCanvas('cellTexture_2', 81, 81)!;
    const tex_2 = this.textures.get('cellTexture_2');
    tex_2.setFilter(Phaser.Textures.NEAREST);
    this.tmpImage_2 = this.cellTexture_2.context.createImageData(81, 81);
    
    this.cellTexture_3 = this.textures.createCanvas('cellTexture_3', 27, 27)!;
    const tex_3 = this.textures.get('cellTexture_3');
    tex_3.setFilter(Phaser.Textures.NEAREST);
    this.tmpImage_3 = this.cellTexture_3.context.createImageData(27, 27);
    
    this.cellTexture_4 = this.textures.createCanvas('cellTexture_4', 9, 9)!;
    const tex_4 = this.textures.get('cellTexture_4');
    tex_4.setFilter(Phaser.Textures.NEAREST);
    this.tmpImage_4 = this.cellTexture_4.context.createImageData(9, 9);

    this.cellTexture_5 = this.textures.createCanvas('cellTexture_5', 3, 3)!;
    const tex_5 = this.textures.get('cellTexture_5');
    tex_5.setFilter(Phaser.Textures.NEAREST);
    this.tmpImage_5 = this.cellTexture_5.context.createImageData(3, 3);

    // ! SHADERS
    const background = this.add.renderTexture(0, 0, this.scale.width, this.scale.height)
    .setOrigin(0, 0)
    .setScrollFactor(0);
    this.backgroundShader = this.add.shader('BG', 0, 0, this.scale.width, this.scale.height)
    .setOrigin(0, 0)
    .setScrollFactor(0);
    const bg_mask = this.backgroundShader.createBitmapMask();
    background.setMask(bg_mask);

    const cells = this.add.renderTexture(0, 0, this.scale.width, this.scale.height)
    .setOrigin(0, 0)
    .setScrollFactor(0);
    this.cellShader = this.add.shader('CELLS', 0, 0, this.scale.width, this.scale.height,
      [
        'cellTexture_0',
        'cellTexture_1',
        'cellTexture_2',
        'cellTexture_3',
        'cellTexture_4',
        'cellTexture_5',
      ])
    .setOrigin(0, 0)
    .setScrollFactor(0);
    const cells_mask = this.cellShader.createBitmapMask();
    cells.setMask(cells_mask);

    const grid = this.add.renderTexture(0, 0, this.scale.width, this.scale.height)
    .setOrigin(0, 0)
    .setScrollFactor(0);
    this.shader = this.add.shader('Grid', 0, 0, this.scale.width, this.scale.height)
    .setOrigin(0, 0)
    .setScrollFactor(0);
    const grid_mask = this.shader.createBitmapMask();
    grid.setMask(grid_mask);
    // ! END OF SHADERS

    this.debugGfx = this.add.graphics();

    const hudGroup = this.add.group();
    this.text = this.add.text(0, 0, 'Hello World!')
    .setOrigin(0, 0)
    .setPosition(this.scale.width/2 - 200, 100);

    const UpButton = this.add.sprite(0, 0, 'grid')
    .setScale(0.33)
    .setInteractive()
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setPosition(256 / 6, 256 / 6)
    .on('pointerup', (pointer : Phaser.Input.Pointer) =>
    {
        this.button_pressed = true;
        this.input.stopPropagation();
        this.cellLevel = Math.max(-5, this.cellLevel - 1);
        this.cameras.main.zoomTo(3 ** (this.cellLevel), 1000, 'Quint.easeIn', true);

        // floor the active cell's x and y positions and
        // then scale them to the new grid size.
        const lodFactor = (3 ** -this.cellLevel);
        const newX = Math.floor(this.activeCell.x / (lodFactor));
        const newY = Math.floor(this.activeCell.y / (lodFactor));
        this.activeCell.x = newX * lodFactor;
        this.activeCell.y = newY * lodFactor;

        this.zoomSeeking = true;
        console.log('from the up button!');
    });

    const DownButton = this.add.sprite(0, 0, 'grid')
    .setScale(0.33)
    .setInteractive()
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setPosition(256 / 6, 256 / 2 + 20) 
    .setTint(0X88FFFF88)
    .on('pointerup', (pointer : Phaser.Input.Pointer) =>
    {
        this.button_pressed = true;
        this.input.stopPropagation();
        this.cellLevel = Math.min(0, this.cellLevel + 1);
        this.tweens.killTweensOf(this.cameras.main);
        this.cameras.main.zoomTo(3 ** (this.cellLevel), 1000, 'Quint.easeIn', true);
        
        // floor the active cell's x and y positions and
        // then scale them to the new grid size.
        const lodFactor = (3 ** -this.cellLevel);
        const newX = Math.floor(this.activeCell.x / (lodFactor)) + 1;
        const newY = Math.floor(this.activeCell.y / (lodFactor)) + 1;
        this.activeCell.x = newX * lodFactor;
        this.activeCell.y = newY * lodFactor;

        this.zoomSeeking = true;
        console.log('from the down button!');
    });

    hudGroup.add(UpButton);
    hudGroup.add(DownButton);
    hudGroup.add(this.text);
    hudGroup.add(grid);
    hudGroup.add(background);
    hudGroup.add(cells);
    hudGroup.add(this.shader);
    hudGroup.add(this.backgroundShader);
    hudGroup.add(this.cellShader);

    this.HUD_cam.ignore(this.debugGfx);
    this.cameras.main.ignore(hudGroup);

    // ! center the camera and active cell initially
    this.cameras.main.scrollX = (256 / 3) * (729 / 2) + this.scale.width / 4;
    this.cameras.main.scrollY = (256 / 3) * (729 / 2) + this.scale.height / 4;
    this.activeCell = new Phaser.Math.Vector2(Math.floor(729 / 2), Math.floor(729 / 2));

    // ! POINTER up EVENT
    this.input.on('pointerup', (pointer : Phaser.Input.Pointer) => {
        if(this.button_pressed){
            this.button_pressed = false;
            return;
        }

        const cam = this.cameras.main;
        console.log({pointer});
        const pos = cam.getWorldPoint(pointer.x, pointer.y);

        const max_dim = 729 * (256 / 3);
        if(pos.x < 0 || pos.x >= max_dim || pos.y < 0 || pos.y >= max_dim){
            return;
        }

        this.zoomSeeking = true;
        const delay = (3 - cam.zoom)/3 * 3500 + 200;

        setTimeout(() => {this.zoomSeeking = false;}, delay);

        // cam.zoomTo(3, delay, 'Quint.easeIn');
        console.log({delay});

        const previousCell = this.activeCell;
        // divide both axis by cell size
        // floor the axis to snap to grid
        this.activeCell = new Phaser.Math.Vector2(Math.floor(pos.x / (256 / 3)), Math.floor(pos.y / (256 / 3)));

        // floor the active cell's x and y positions and
        // then scale them to the new grid size.
        const lodFactor = (3 ** -this.cellLevel);
        const newX = Math.floor(this.activeCell.x / (lodFactor));
        const newY = Math.floor(this.activeCell.y / (lodFactor));
        this.activeCell.x = newX * lodFactor;
        this.activeCell.y = newY * lodFactor;

        // double selecting a cell
        if(previousCell.x == this.activeCell.x && previousCell.y == this.activeCell.y){
            const popup = document.getElementById('popup')!;
            // const msg = this.server.playCell(this.activeCell, this.currentUser);
            const msg = this.server.winGame(this.activeCell, this.currentUser);
            popup.textContent = msg?? '';
        }

    });

    setInterval(async () => {
        if(Math.random() < 0.40){
            await this.CopyGridToTexture();
        }
    }, 100);

    this.cursors.space.addListener('up', () => {
        if(this.currentUser == this.user_1) this.currentUser = this.user_2;
        else this.currentUser = this.user_1;
    })


    console.log(`create() done at: ${Date.now() - this.START_TIME}`);
  }



  override update(time: number, delta: number): void {
    const dt = delta / 1000;
    const cam = this.cameras.main;

    this.debugGfx.clear();

    if(this.cursors.right.isDown){
        cam.scrollX += dt * 400 * (1 / cam.zoom); 
    }

    if(this.cursors.left.isDown){
        cam.scrollX -= dt * 400 * (1 / cam.zoom); 
    }

    if(this.cursors.down.isDown){
        cam.scrollY += dt * 400 * (1 / cam.zoom); 
    }

    if(this.cursors.up.isDown){
        cam.scrollY -= dt * 400 * (1 / cam.zoom); 
    }

    if(this.cursors.shift.isDown){
        // cam.zoom = Math.min(cam.zoom * (1 + dt * 1.5), 3);
    }

    if(this.cursors.space.isUp){
        // cam.zoom = Math.max(cam.zoom * (1 - dt * 1.5), 0.01);
        // if(this.currentUser == this.user_1) this.currentUser = this.user_2;
        // else this.currentUser = this.user_1;
    }


    if(this.zoomSeeking){
        const frustum = cam.worldView;
        const diff = this.activeCell.clone().
        scale(256 / 3).
        add({x: 256 / 6, y: 256 / 6}).
        subtract(new Phaser.Math.Vector2(frustum.x + frustum.width / 2, frustum.y + frustum.height / 2));

        const alpha = dt / (0.4 + dt);
        const newPos = new Phaser.Math.Vector2(cam.scrollX, cam.scrollY).add(diff.scale(alpha));

        cam.scrollX = newPos.x;
        cam.scrollY = newPos.y;
    }

    this.shader.setUniform('cameraScrollX.value', cam.scrollX);
    this.shader.setUniform('cameraScrollY.value', cam.scrollY);
    this.shader.setUniform('zoom.value', cam.zoom);

    this.backgroundShader.setUniform('time.value', time);
    this.backgroundShader.setUniform('cameraScrollX.value', cam.scrollX);
    this.backgroundShader.setUniform('cameraScrollY.value', cam.scrollY);
    this.backgroundShader.setUniform('zoom.value', cam.zoom);

    this.cellShader.setUniform('time.value', time);
    this.cellShader.setUniform('cameraScrollX.value', cam.scrollX);
    this.cellShader.setUniform('cameraScrollY.value', cam.scrollY);
    this.cellShader.setUniform('zoom.value', cam.zoom);

    this.visibleArea = GridHandler.GetClippingFrustum(cam, this.grids)!;
    if(this.visibleArea){
        this.debugGfx.lineStyle(24 / cam.zoom + 24, 0XFFFF00FF);
        this.debugGfx.strokeRect(
            this.visibleArea.x * (256/3),
            this.visibleArea.y * (256/3),
            -(this.visibleArea.width * (256/3)),
            -(this.visibleArea.height * (256/3))
        );
    }

    if(this.activeCell){
        this.debugGfx.lineStyle(2  * (3 ** -this.cellLevel) + 6, 0XFFFFFFFF);
        this.debugGfx.strokeRect(
            this.activeCell.x * 256/3,
            this.activeCell.y * 256/3,
            256 / 3 * (3 ** -this.cellLevel),
            256 / 3 * (3 ** -this.cellLevel)
        );
    }

    this.text.
    setText(`
time:${UTILS.fmtString(delta)}
FPS: ${UTILS.fmtString(1000 / delta)}
zoom: ${UTILS.fmtString(this.cameras.main.zoom)}
inverse zoom: ${UTILS.fmtString(1/cam.zoom)}
camera: {${UTILS.fmtString(cam.scrollX)}, ${UTILS.fmtString(cam.scrollY)}}
Level: ${this.cellLevel}
activeCell: ${this.activeCell.x}, ${this.activeCell.y}
currentUser: ${this.currentUser}
`);
    this.text.setColor('black');
    
  }

}
