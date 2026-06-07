local red = { r = 1, g = 0, b = 0, a = 1 }
local green = { r = 0, g = 1, b = 0, a = 1 }
local blue = { r = 0, g = 0, b = 1, a = 1 }

local function set_world_wire(name, tint)
    local sprite = data.raw["utility-sprites"]["default"][name]
    sprite.filename = "__wire_art__/graphics/hr-generic-wire_white_0.2.png"
    sprite.tint = tint
end

data.raw["utility-sprites"]["default"].wire_shadow.filename = "__core__/graphics/empty.png"

set_world_wire("red_wire", red)
set_world_wire("green_wire", green)
set_world_wire("copper_wire", blue)

-- TODO: Disable wire highlight sprites (use global startup setting)
