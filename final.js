var fabric = require('fabric').fabric
var fs = require('fs');

const fabricJSON = require('./resp.json');

const fontsData = fabricJSON.objects.filter(obj => obj.type === "textbox").map(obj => {
    return {
      family: obj.fontFamily,
      weight: obj.fontWeight,
      size: obj.fontSize,
      style: obj.fontStyle,
      path: '../fonts/all/'+obj.fontFamily+'.ttf'
    }
});

fontsData?.forEach(obj => {
    fabric.nodeCanvas.registerFont(obj.path, { family: obj.family, style: obj.style, weight: obj.weight })
});

const canvas_width = 1080
const canvas_height = 1920

const aspect_change_x = 1
const aspect_change_y = 1.78

fabricJSON.objects.forEach(obj => {
    if(obj.type === "image"){
        if(obj.customMetaData.name !== "Image-Primary"){
            left_margin = obj.left
            top_margin = obj.top

            scaleX = obj.scaleX
            scaleY = obj.scaleY

            obj.left = aspect_change_x*left_margin
            obj.top = aspect_change_y*top_margin

            obj.scaleX = aspect_change_x*scaleX
            obj.scaleY = aspect_change_y*scaleY
        }else{
            obj_actual_height = obj.height*obj.scaleY
            obj_actual_width = obj.width*obj.scaleX
            if(obj_actual_width>=1070 && obj_actual_width<=1090 && obj_actual_height>=1070 && obj_actual_width<=1090){
                height = obj.height
                width = obj.width
    
                req_scaleX = canvas_width/width
                req_scaleY = canvas_height/height
    
                const scale = Math.max(req_scaleX, req_scaleY)
    
                obj.scaleX = scale
                obj.scaleY = scale
    
                const crop = ((width*scale)-canvas_width)/(2*scale)
    
                obj.cropX = crop
            }else{
                left_margin = obj.left
                top_margin = obj.top

                let height_req=Math.abs(aspect_change_y-1)*obj.height
                let width_req=0
    
                obj.left = (aspect_change_x*left_margin)+width_req
                obj.top = (aspect_change_y*top_margin)+height_req
            }
        }
    }else{
        left_margin = obj.left
        top_margin = obj.top
        width = obj.width
        height = obj.height

        obj.left = aspect_change_x*left_margin
        obj.top = aspect_change_y*top_margin
        obj.width = aspect_change_x*width
        obj.height = aspect_change_y*height
    }
})


const render_image = (path) => {
    const canvas = new fabric.Canvas('canvas', {width:1080, height:1920});
    canvas.loadFromJSON(fabricJSON, () => {
        const image = canvas.toDataURL('image/png');
        var data = image.replace(/^data:image\/\w+;base64,/, "");
        var buf = Buffer.from(data, 'base64');
        fs.writeFileSync('results/'+path, buf);
    });
}

render_image('final.png')