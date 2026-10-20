
function idx(x: number, y: number, width : number = 729, height: number = 729) : number{
    if(x < 0 || x >= width || y < 0 || y >= height)
        throw new Error(`out of bounds access: ${x}, ${y} for size: ${width}, ${height}`);
    
    return y * width + x;
}

function teamSelector(): Function{
    let teamSelector = false;
    return () =>{
        const value = teamSelector? PlayerTeam.RED : PlayerTeam.BLUE;
        teamSelector = !teamSelector;
        return value;
    }
}

enum CellState{
    EMPTY =        0,
    RED =          1,
    BLUE =         2,
    STARTED_RED =  3,
    STARTED_BLUE = 4,
};
enum PlayerTeam{
    NON =  0,
    RED =  1,
    BLUE = 2,
};

function randomizeGrid(grid : Uint32Array, gridSize : number, frustum: {x: number, y: number, width: number, height: number}){
    for(let i=0; i< frustum.width * frustum.height >> 4; i++){
        const randomY = frustum.y + Math.random() * frustum.height;
        const randomX = frustum.x + Math.random() * frustum.width;
        let randomIndex = randomY * gridSize + randomX;
        randomIndex = Math.floor(randomIndex);
        if(Math.random() > 0.5  ){ 
            if(Math.random() > 0.5){
                grid[randomIndex] = 0XE00000FF;
            }else{
                grid[randomIndex] = 0XE0FF0000;
            }
        }else{
            grid[randomIndex] = 0X00000000;
        }
    }
}

export class ServerMock{

    // 729
    grid_0: Uint32Array;

    // 243
    grid_1: Uint32Array;

    // 81
    grid_2: Uint32Array;

    // 27
    grid_3: Uint32Array;

    // 9
    grid_4: Uint32Array;

    // 3
    grid_5: Uint32Array;
    
    players: Map<string, PlayerTeam>;

    selector!: Function;

    private bytesSent : number = 0;
    private requestCount : number = 0;
    private lastBytesSent : number = 0;
    private lastRequestCount : number = 0;

    statsLog? : {byteRate: number, requestRate: number,
        timeStamp: string, bytesPerRequest: number};

    constructor(){
        // this grid is the "source of truth"
        this.grid_0 = new Uint32Array(729 ** 2);

        // these grids only function to optimize the resolution
        // of larger LOD games.
        this.grid_1 = new Uint32Array(243 ** 2);
        this.grid_2 = new Uint32Array(81 ** 2);
        this.grid_3 = new Uint32Array(27 ** 2);
        this.grid_4 = new Uint32Array(9 ** 2);
        this.grid_5 = new Uint32Array(3 ** 2);

        this.players = new Map();
        this.selector = teamSelector();

        setInterval(() => {
            const byteRate = (this.bytesSent - this.lastBytesSent) / 2.5;
            const requestRate = (this.requestCount - this.lastRequestCount) / 2.5;

            this.statsLog = {byteRate: byteRate, requestRate: requestRate,
                timeStamp: new Date(Date.now()).toTimeString(), bytesPerRequest: byteRate / requestRate};

            this.lastBytesSent = this.bytesSent;
            this.lastRequestCount = this.requestCount;
            console.log(this.statsLog);
        }, 2500);
    }

    registerNewPlayer() : string{
        var newUserId : string;
        while(true){
            newUserId = this.makeid(24);
            if(!this.players.has(newUserId)){
                this.players.set(newUserId, Math.random() < 0.5? PlayerTeam.RED : PlayerTeam.BLUE);
                break;
            }
        }

        return newUserId;
    }

    loginPlayer(user: string) : {success: boolean, team: PlayerTeam | undefined}{
        return {success: this.players.has(user), team: this.players.get(user)};
    }

    // every cell is stored in 2 bits
    getUpdatedGrid_BitPacked(user : string, frustum: {x: number, y: number, width: number, height: number}) :
    {cells: Uint8Array, frustum: {x: number, y: number, width: number, height: number}} | undefined{
        if(!this.loginPlayer(user).success){
            return undefined;
        }

        // if frustum is invalid then reject request
        if(
            frustum.x < 0 || frustum.x > 729 ||
            frustum.y < 0 || frustum.y > 729 ||
            frustum.width < 0 || frustum.width > 729 ||
            frustum.height < 0 || frustum.height > 729
        ){
            return undefined;
        }

        const cellCount = frustum.width * frustum.height;
        const quadruplets = Math.floor(cellCount / 4);
        let bitPackedCells = new Uint8Array(quadruplets);

        let cellIndex = 0;
        for (let i = 0; i < frustum.height; i++) {
            for (let j = 0; j < frustum.width; j++) {
                const cellValue = this.grid_0[idx(frustum.x + j, frustum.y + i)];
                const cellPositionWithinQuadruplet = cellIndex % 4;

                bitPackedCells[Math.floor(cellIndex / 4)] |= (cellValue << (cellPositionWithinQuadruplet * 2));
                cellIndex++;
            }   
        }

        this.bytesSent += bitPackedCells.byteLength + 16; // +16 for the frustum.
        this.requestCount += 1;
        return {cells: bitPackedCells, frustum: frustum};
    }

    getUpdatedGrid(user : string, frustum: {x: number, y: number, width: number, height: number}) : Uint8Array | undefined{
        if(!this.loginPlayer(user).success){
            return undefined;
        }

        // if frustum is invalid then reject request
        if(
            frustum.x < 0 || frustum.x > 729 ||
            frustum.y < 0 || frustum.y > 729 ||
            frustum.width < 0 || frustum.width > 729 ||
            frustum.height < 0 || frustum.height > 729
        ){
            return undefined;
        }

        let respList = new Uint8Array(frustum.width * frustum.height);
        for(let i=0; i<frustum.height; i++){
            for(let j=0; j<frustum.width; j++){
                const resp_index = idx(j, i, frustum.width, frustum.height);
                const world_index = idx(j + frustum.x, i + frustum.y);
                respList[resp_index] = this.grid_0[world_index];
            }
        }

        this.bytesSent += respList.byteLength;
        this.requestCount += 1;
        return respList;
    }

    winGame(position: {x: number, y: number}, user: string){
        console.log(`win request at: ${Date.now()} at position: ${position.x}, ${position.y}`);
        const player = this.loginPlayer(user);
        if(!player.success){
            return `ERROR: player '${user}' not found!`;
        }
        const playerTeam = player.team!;

        const leftMost = Math.floor(position.x / 3) * 3;
        const topMost = Math.floor(position.y / 3) * 3;

        for(let i=0; i<3; i++){
            for(let j=0; j<3; j++){
                this.grid_0[idx(leftMost + j, topMost + i)] = playerTeam;
            }
        }

        this.resolveAllLevels(leftMost, topMost, playerTeam);

    }

    playCell(position: {x: number, y: number}, user: string) : string{
        console.log(`received request at: ${Date.now()} at position: ${position.x}, ${position.y}`);
        
        const player = this.loginPlayer(user);
        if(!player.success){
            return `ERROR: player '${user}' not found!`;
        }
        const playerTeam = player.team!;
        
        if(position.x < 0 || position.x >= 729 || position.y < 0 || position.y >= 729){
            return 'ERROR: point out of bounds!';
        }

        const index = position.y * 729 + position.x;
        const currentCell = this.grid_0[index];
        if(currentCell != 0){
            return 'ERROR: this position has already been played!';
        }
        // each game is a 3x3 area of the grid aligned
        // to the finest LOD's grid.
        const leftMost = Math.floor(position.x / 3) * 3;
        const topMost = Math.floor(position.y / 3) * 3;

        const lastPlayingTeam = this.lastPlayingTeam(topMost, leftMost);
        console.log({lastPlayingTeam});
        // boolean flag, if true then red team, otherwise blue team
        // 0 means its a new game, 1 means 
        if(lastPlayingTeam == PlayerTeam.NON){
            this.grid_1[idx(Math.floor(position.x / 3), Math.floor(position.y / 3), 243, 243)] = playerTeam! + 2;
        }
        else if(playerTeam == PlayerTeam.RED && lastPlayingTeam == PlayerTeam.RED){
            return `ERROR: your team 'red' has already played this turn, wait for the 'blue' team to play!`;
        }else if(playerTeam == PlayerTeam.BLUE && lastPlayingTeam == PlayerTeam.BLUE){
            return `ERROR: your team 'blue' has already played this turn, wait for the 'red' team to play!`;
        }

        // actually play the game
        this.grid_0[index] = playerTeam;

        this.resolveAllLevels(leftMost, topMost, playerTeam);

        return '';
    }

    
    private resolveAllLevels(leftMost: number, topMost: number, player_team : PlayerTeam){

        const original_leftmost = leftMost;
        const original_topmost = topMost;

        // determines how high a resolution has bubbled up
        let highest_lod : number = -1;
        
        const cellState = player_team == PlayerTeam.RED? CellState.RED : CellState.BLUE;
        const level_0_won = this.resolveGame(leftMost, topMost, 0);
        if(level_0_won){
            console.log("level 0 won!");
            highest_lod = 0;
            this.grid_1[idx(Math.floor(leftMost / 3), Math.floor(topMost / 3), 243, 243)] = cellState ;
            this.grid_2[idx(Math.floor(leftMost / 9), Math.floor(topMost / 9), 81, 81)] = cellState + 2;

            // snap coords to the higher level LOD before passing the values.
            leftMost = Math.floor(leftMost / 9) * 9;topMost = Math.floor(topMost / 9) * 9;
            const level_1_won = this.resolveGame(leftMost, topMost, 1);
            if(level_1_won){
                console.log("level 1 won!");
                highest_lod = 1;
                this.grid_2[idx(Math.floor(leftMost / 9), Math.floor(topMost / 9), 81, 81)] = cellState;
                this.grid_3[idx(Math.floor(leftMost / 27), Math.floor(topMost / 27), 27, 27)] = cellState + 2;

                // snap coords to the higher level LOD before passing the values.
                leftMost = Math.floor(leftMost / 27) * 27;topMost = Math.floor(topMost / 27) * 27;
                const level_2_won = this.resolveGame(leftMost, topMost, 2);
                if(level_2_won){
                    console.log("level 2 won!");
                    highest_lod = 2;
                    this.grid_3[idx(Math.floor(leftMost / 27), Math.floor(topMost / 27), 27, 27)] = cellState;
                }
            }
        } 
        if(highest_lod < 0) return;
        const scaler = 3 ** (highest_lod + 1);
        this.fillAllSquares(Math.floor(original_leftmost / scaler) * scaler, Math.floor(original_topmost / scaler) * scaler, highest_lod, cellState);
    }

    // fills all sqaures of a lod and all its finer level LODs.
    private fillAllSquares(worldX: number, worldY: number, highestLod: number, value: CellState) {        
        // The "box" size in world coordinates (grid_0)
        const worldSize = 3 ** (highestLod + 1);
        
        for (let lod = highestLod; lod >= 0; lod--) {
            const scaler = 3 ** lod;
            
            // At each LOD, we draw from (worldX / scaler) 
            // with a size of (worldSize / scaler)
            const startX = worldX / scaler;
            const startY = worldY / scaler;
            const sizeAtLod = worldSize / scaler;
        
            this.fillArea(
                startX, 
                startY, 
                startX + sizeAtLod, 
                startY + sizeAtLod, 
                lod, 
                value
            );
        }
    }

    private fillArea(leftMost: number, topMost: number, rightMost: number, bottomMost: number, lod: number, value : CellState){
        const lod_key = `grid_${lod}` as keyof this;
        const lod_grid = this[lod_key] as Uint32Array;
        const size = 729 / 3 ** lod;

        console.log(`drawing from {${leftMost}, ${topMost}} to {${rightMost}, ${bottomMost}}`);
        
        for(let top = topMost;top < bottomMost; top++){
            for(let left = leftMost;left < rightMost; left++){
                lod_grid[idx(left, top, size, size)] = value;   
            }   
        }
    }

    // fills the playing area with a square the color of the winning team
    private fillSquare(leftMost: number, topMost: number, lod: number, value : CellState){
        const lod_key = `grid_${lod}` as keyof this;
        const lod_grid = this[lod_key] as Uint32Array;
        const size = 729 / 3 ** lod;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                lod_grid[idx(leftMost + j, topMost + i, size, size)] = value;
            }
        }
    }

    // determines which team won, plays the game for a given LOD
    // it only resolves a 3x3 area of the given LOD.
    // 
    // this function relies on a logical optimization, assuming a game is checked
    // every turn then it follows that the last playing team is the winning one, which is why
    // we only return a boolean.
    private resolveGame(leftMost: number, topMost: number, lod_level : number) : boolean{
        const lod_key = `grid_${lod_level}` as keyof this;
        const lod = this[lod_key] as Uint32Array;
        const scaler = 3 ** lod_level;
        const size = 729 / scaler;
        let game_won = false;
        leftMost = Math.floor(leftMost / scaler);
        topMost =  Math.floor(topMost /  scaler);

        console.log(`sqrt: ${Math.sqrt(lod.length)}, {${leftMost}, ${topMost}}`);
        const area = {
            topLeft: lod[idx(leftMost, topMost, size, size)], topMiddle: lod[idx(leftMost + 1, topMost, size, size)], topRight: lod[idx(leftMost + 2, topMost, size, size)],
            middleLeft: lod[idx(leftMost, topMost + 1, size, size)], middleMiddle: lod[idx(leftMost + 1, topMost + 1, size, size)], middleRight: lod[idx(leftMost + 2, topMost + 1, size, size)],
            bottomLeft: lod[idx(leftMost, topMost + 2, size, size)], bottomMiddle: lod[idx(leftMost + 1, topMost + 2, size, size)], bottomRight: lod[idx(leftMost + 2, topMost + 2, size, size)],
        }
        
        console.log(area);
        
        

        // Top row
        if(
            lod[idx(leftMost, topMost, size, size)] === lod[idx(leftMost+1, topMost, size, size)] &&
            lod[idx(leftMost+1, topMost, size, size)] === lod[idx(leftMost+2, topMost, size, size)] &&
            lod[idx(leftMost, topMost, size, size)] != 0
        ){
            game_won = true;
        }
        // Center row
        else if(
            lod[idx(leftMost, topMost+1, size, size)] === lod[idx(leftMost+1, topMost+1, size, size)] &&
            lod[idx(leftMost+1, topMost+1, size, size)] === lod[idx(leftMost+2, topMost+1, size, size)] &&
            lod[idx(leftMost, topMost+1, size, size)] != 0
        ){
            game_won = true;
        }
        // Bottom row
        else if(
            lod[idx(leftMost, topMost+2, size, size)] === lod[idx(leftMost+1, topMost+2, size, size)] &&
            lod[idx(leftMost+1, topMost+2, size, size)] === lod[idx(leftMost+2, topMost+2, size, size)] &&
            lod[idx(leftMost, topMost+2, size, size)] != 0
        ){
            game_won = true;
        }
        // Left column
        else if(
            lod[idx(leftMost, topMost, size, size)] === lod[idx(leftMost, topMost+1, size, size)] &&
            lod[idx(leftMost, topMost+1, size, size)] === lod[idx(leftMost, topMost+2, size, size)] &&
            lod[idx(leftMost, topMost, size, size)] != 0
        ){
            game_won = true;
        }
        // Center column
        else if(
            lod[idx(leftMost+1, topMost, size, size)] === lod[idx(leftMost+1, topMost+1, size, size)] &&
            lod[idx(leftMost+1, topMost+1, size, size)] === lod[idx(leftMost+1, topMost+2, size, size)] &&
            lod[idx(leftMost+1, topMost, size, size)] != 0
        ){
            game_won = true;
        }
        // Right column
        else if(
            lod[idx(leftMost+2, topMost, size, size)] === lod[idx(leftMost+2, topMost+1, size, size)] &&
            lod[idx(leftMost+2, topMost+1, size, size)] === lod[idx(leftMost+2, topMost+2, size, size)] &&
            lod[idx(leftMost+2, topMost, size, size)] != 0
        ){
            game_won = true;
        }
        // Top-left to bottom-right diagonal
        else if(
            lod[idx(leftMost, topMost, size ,size)] === lod[idx(leftMost+1, topMost+1, size, size)] &&
            lod[idx(leftMost+1, topMost+1, size, size)] === lod[idx(leftMost+2, topMost+2, size, size)] &&
            lod[idx(leftMost, topMost, size, size)] != 0
        ){
            game_won = true;
        }
        // Top-right to bottom-left diagonal
        else if(
            lod[idx(leftMost+2, topMost, size, size)] === lod[idx(leftMost+1, topMost+1, size, size)] &&
            lod[idx(leftMost+1, topMost+1, size, size)] === lod[idx(leftMost, topMost+2, size, size)] &&
            lod[idx(leftMost+2, topMost, size, size)] != 0
        ){
            game_won = true;
        }

        return game_won;
    }

    // tries to find which team was the one to last play the game
    private lastPlayingTeam(topMost: number, leftMost: number) : PlayerTeam{
        let startingTeam = this.grid_1[idx(leftMost / 3, topMost / 3, 243, 243)];
        if(startingTeam == CellState.EMPTY){
           return PlayerTeam.NON 
        }
        startingTeam -= 2;

        let cellsOccupied = 0;
        for(let i = 0; i < 3; i++){
            for(let j = 0; j < 3; j++){
                const currentCell = this.grid_0[idx(leftMost + j, topMost + i)];
                if(currentCell != CellState.EMPTY){
                    cellsOccupied += 1;
                }
            }
        }

        if(cellsOccupied % 2 == 0){
            return this.otherTeam(startingTeam);
        }else{
            return startingTeam;
        }
    }

    private otherTeam(currentTeam : PlayerTeam) : PlayerTeam{
        if(currentTeam == PlayerTeam.BLUE){
            return PlayerTeam.RED;
        }else if(currentTeam == PlayerTeam.RED){
            return PlayerTeam.BLUE;
        }

        throw new Error(`'NON' doesn't have an opposite team`);
    }

    // credits: 'csharptest.net' and 'TylerH' from stack over flow
    private makeid(length : number) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;

        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

}