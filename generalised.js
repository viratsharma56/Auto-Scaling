var fabric = require('fabric').fabric
var fs = require('fs');

const input_image_width = 1080
const input_image_height = 1080

const req_aspect_ratio = "1.91:1"
const req_image_width = 1200
const req_image_height = 628

const aspect_values = {
    "1:1": {
        aspect_change_x: 1,
        aspect_change_y: 1
    },
    "1.91:1": {
        aspect_change_x: 1.91,
        aspect_change_y: 1
    },
    "9:16": {
        aspect_change_x: 1,
        aspect_change_y: 16 / 9
    },
    "4:5": {
        aspect_change_x: 1,
        aspect_change_y: 1.25
    },
    "940:768": {
        aspect_change_x: 940 / 768,
        aspect_change_y: 1
    },
    "728:90": {
        aspect_change_x: 728 / 90,
        aspect_change_y: 1
    }
}

const fabricJSON = require(`./JSON/resp_12.json`);
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

const aspect_change_x = aspect_values[req_aspect_ratio].aspect_change_x
const aspect_change_y = aspect_values[req_aspect_ratio].aspect_change_y

const canvas_width = input_image_width * aspect_change_x
const canvas_height = input_image_height * aspect_change_y

const convertJSON = (baseJSON) => {
    const newJSON = {"objects": []}

    for(key in baseJSON){
        if(key!="objects") newJSON[key] = baseJSON[key]
    }

    const objects = baseJSON.objects
    for(let i=0; i<objects.length; i++){
        let obj = objects[i]
        if (obj.type === "image") {
            obj_actual_height = obj.height * obj.scaleY
            obj_actual_width = obj.width * obj.scaleX
            if (obj_actual_width >= input_image_width && obj_actual_height >= input_image_height) {
                height = obj.height
                width = obj.width

                req_scaleX = canvas_width / width
                req_scaleY = canvas_height / height

                const scale = Math.max(req_scaleX, req_scaleY)

                obj.scaleX = scale
                obj.scaleY = scale

                const crop_left = ((width * scale) - canvas_width) / (2)
                const crop_top = ((height * scale) - canvas_height) / (2)

                obj.left-=crop_left
                obj.top-=crop_top
            } else {
                left_margin = obj.left
                top_margin = obj.top

                let height_req = Math.abs(aspect_change_y - 1) * obj.height
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
        newJSON.objects.push(obj)
    }
    return newJSON
}

const render_image = (path, json) => {
    const canvas = new fabric.Canvas('canvas', { width: req_image_width, height: req_image_height });
    canvas.loadFromJSON(json, () => {
        const image = canvas.toDataURL('image/png');
        var data = image.replace(/^data:image\/\w+;base64,/, "");
        var buf = Buffer.from(data, 'base64');
        fs.writeFileSync(`results/${req_aspect_ratio}/` + path, buf);
    });
}

const newJSON = convertJSON(fabricJSON)

const scale_factor = req_image_width / canvas_width

newJSON.objects.forEach((obj) => {
    obj.left *= scale_factor
    obj.top *= scale_factor

    obj.scaleX *= scale_factor
    obj.scaleY *= scale_factor
})

render_image(`final_12.png`, newJSON)