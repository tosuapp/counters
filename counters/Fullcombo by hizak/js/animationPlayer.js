class AnimationPlayer{
    constructor(img_element,apng,default_image){
        this.img_element = img_element
        this.apng = apng;
        this.default_image = default_image

        this.reset_frame()
        console.log(this.apng)
    }
    reset_frame(){
        this.img_element.src = this.default_image
    }
    play(){
        this.img_element.src = this.apng
    }
}