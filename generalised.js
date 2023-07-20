var fabric = require('fabric').fabric
var fs = require('fs');

const input_image_width = 1080
const input_image_height = 1080

const req_aspect_ratio = "9:16"
const req_image_width = 1080
const req_image_height = 1920

const convertJSON = (baseJSON, aspect_change_x, aspect_change_y) => {
    baseJSON.objects.forEach((obj) => {
        if (obj.type === "image") {
            obj_actual_height = obj.height * obj.scaleY
            obj_actual_width = obj.width * obj.scaleX
            if (obj_actual_width >= input_image_width && obj_actual_height >= input_image_height) {
                height = obj.height
                width = obj.width

                req_scaleX = req_image_width / width
                req_scaleY = req_image_height / height

                const scale = Math.max(req_scaleX, req_scaleY)

                obj.scaleX = scale
                obj.scaleY = scale

                const crop_left = ((width * scale) - req_image_width) / (2)
                const crop_top = ((height * scale) - req_image_height) / (2)

                obj.left-=crop_left
                obj.top-=crop_top
            } else {
                left_margin = obj.left
                top_margin = obj.top

                let height_req = Math.abs(aspect_change_y-1)*obj.height/2
                let width_req = 0

                obj.left = (aspect_change_x * left_margin) + width_req
                obj.top = (aspect_change_y * top_margin) + height_req
            }
        } else {
            left_margin = obj.left
            top_margin = obj.top
            width = obj.width
            height = obj.height

            obj.left = aspect_change_x * left_margin
            obj.top = aspect_change_y * top_margin
            obj.width = aspect_change_x * width
            obj.height = aspect_change_y * height
        }
    })
    return baseJSON
}

const render_image = (path, json, width, height) => {
    const canvas = new fabric.Canvas('canvas', { width: req_image_width, height: req_image_height });
    canvas.loadFromJSON(json, () => {
        const image = canvas.toDataURL('image/png');
        var data = image.replace(/^data:image\/\w+;base64,/, "");
        var buf = Buffer.from(data, 'base64');
        fs.writeFileSync(`results/${req_aspect_ratio}/` + path, buf);
    });
}

const scaleJSON = (baseJSON, scale_factor) => {
    baseJSON.objects.forEach((obj) => {
        obj.left *= scale_factor
        obj.top *= scale_factor

        obj.scaleX *= scale_factor
        obj.scaleY *= scale_factor
    })

    return baseJSON
}

for(let i=1; i<=12; i++){
    const fabricJSON = require(`./JSON/resp_${i}.json`);
    const fontsData = fabricJSON.objects.filter(obj => obj.type === "textbox").map(obj => {
        return {
            family: obj.fontFamily,
            weight: obj.fontWeight,
            size: obj.fontSize,
            style: obj.fontStyle,
            path: '../fonts/all/' + obj.fontFamily + '.ttf'
        }
    });
    
    fontsData?.forEach(obj => {
        fabric.nodeCanvas.registerFont(obj.path, { family: obj.family, style: obj.style, weight: obj.weight })
    });

    let aspect_change_x = 1
    let aspect_change_y = 1

    let new_image_width = Math.max(input_image_width, input_image_height)
    let new_image_height = new_image_width

    if(input_image_width!=input_image_height){
        aspect_change_x = new_image_width/input_image_width
        aspect_change_y = new_image_height/input_image_height
    }

    let newJSON = convertJSON(fabricJSON, aspect_change_x, aspect_change_y)

    const scaleFactor = Math.min(req_image_height, req_image_width)/new_image_width
    newJSON = scaleJSON(newJSON,scaleFactor)

    aspect_change_x=1
    aspect_change_y=1

    if(req_image_height>req_image_width){
        aspect_change_y = req_image_height/req_image_width
    }else{
        aspect_change_x = req_image_width/req_image_height
    }

    newJSON = convertJSON(newJSON, aspect_change_x, aspect_change_y)
    render_image(`final_${i}.png`, newJSON)
}