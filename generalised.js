var fabric = require('fabric').fabric
var fs = require('fs');

const input_image_width = 1200
const input_image_height = 628
const curr_aspect_ratio = "1.91:1"

const req_aspect_ratio = "1:1"
const req_image_width = 1080
const req_image_height = 1080

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

const render_image = (path, json) => {
    const canvas = new fabric.Canvas('canvas', { width: req_image_width, height: req_image_height });
    canvas.loadFromJSON(json, () => {
        const image = canvas.toDataURL('image/png');
        var data = image.replace(/^data:image\/\w+;base64,/, "");
        var buf = Buffer.from(data, 'base64');
        fs.writeFileSync(`results/` + path, buf);
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


const aspect_changes = {
    "1:1": {
        "9:16": {
            "x": 1,
            "y": 1.7778
        },
        "1.91:1": {
            "x": 1.91,
            "y": 1
        },
        "4:5": {
            "x": 1,
            "y": 1.25
        }
    },
    "9:16": {
        "1:1": {
            "x": 1.7778,
            "y": 1
        },
        "1.91:1": {
            "x" : 3.3956,
            "y" : 1
        },
        "4:5": {
            "x": 1.4222,
            "y": 1
        }
    },
    "1.91:1": {
        "1:1": {
            "x": 1,
            "y": 1.91
        },
        "9:16": {
            "x" : 1,
            "y" : 3.3956
        },
        "4:5": {
            "x": 1,
            "y": 2.3875
        }
    },
    "4:5": {
        "1:1": {
            "x": 1.25,
            "y": 1
        },
        "9:16": {
            "x" : 1,
            "y" : 1.4222
        },
        "1.91:1": {
            "x": 2.3875,
            "y": 1
        }
    }
}

for(let i=12; i<=12; i++){
    const fabricJSON = require('./1.91_12.json')

    let newJSON = fabricJSON
    let scaleFactor = 1

    if(req_aspect_ratio==curr_aspect_ratio){
        scaleFactor = req_image_width/input_image_width
        newJSON = scaleJSON(newJSON, scaleFactor)
        render_image('test.png', newJSON)
        return
    }
    render_image('test_initial.png', newJSON)
    const aspect_values = aspect_changes[curr_aspect_ratio][req_aspect_ratio]
    
    const aspect_change_x = aspect_values.x
    const aspect_change_y = aspect_values.y

    console.log(aspect_change_x, aspect_change_y)

    newJSON = convertJSON(newJSON, aspect_change_x, aspect_change_y)
    render_image('test_middle.png', newJSON)

    const new_image_width = aspect_change_x*input_image_width
    const new_image_height = aspect_change_y*input_image_height

    if(new_image_width==input_image_width){
        scaleFactor = req_image_width/new_image_width
    }else{
        scaleFactor = req_image_height/new_image_height
    }

    newJSON = scaleJSON(newJSON, scaleFactor)
    render_image('test_final_hor_sq.png', newJSON)
}