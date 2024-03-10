const tileWrapperNode = document.createElement('div'),
    tileNode = document.createElement('div')
tileWrapperNode.classList.add('wrapper', 'absolute')
tileNode.classList.add('tile', 'absolute')
tileWrapperNode.appendChild(tileNode)

class KeyOverlay {
    /**
     * @param {string} keyId
     * @param {string} tilesId
     * @param {object=}options
     * @param {number=} options.speed
     * @param {string=} options.keyTextId
     */
    constructor(keyId, tilesId, options = { speed: undefined, keyTextId: undefined , keyNameId: undefined}) {
        this.tiles = document.getElementById(tilesId)
        this.keyField = document.getElementById(keyId)
        this.keyText = document.getElementById(options.keyTextId) || undefined
        this.keyName = this.keyText ? this.keyText.innerText : undefined
        this.keyNameText = document.getElementById(options.keyNameId)
        this.speed = options.speed || 0.3
        this.tile = null
    }

    update(key, color, colortap) {
        if (key.isPressed == true) {
            if (!this.tile){
                this.tile = tileWrapperNode.cloneNode(true)
                this.tiles.appendChild(this.tile)
                this.updateTile(color)
            }
            if (this.keyText && key.count !== 0) this.keyText.innerText = key.count
            
            this.keyField.style.backgroundColor = colortap
        } else {
            if (this.tile) {
                this.tile.end = true
                this.keyField.style.backgroundColor = color
            }
            if ((this.keyText && this.keyText.innerText !== this.keyName) && key.count === 0) this.keyText.innerText = this.keyName
        }
    }

    updateTile(color) {
        const start = performance.now()
        const step = () => {
            const now = performance.now();
            const count = Math.min(this.speed * (now - start), this.tiles.lastChild.offsetWidth);
            this.tile.firstChild.style.width = count + "px"
            this.tile.firstChild.style.backgroundColor = color
            if (!this.tile.end) requestAnimationFrame(step)
            else {
                this.tile.style.animation = `moveOut ${this.tile.offsetWidth/this.speed}ms linear forwards`
                setTimeout(() => {
                    this.tiles.firstElementChild.remove()
                }, this.tile.offsetWidth/this.speed)
                this.tile = null
            }
        }
        step()
    }
}

window.KeyOverlay = KeyOverlay