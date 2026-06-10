local wire_art_pin = table.deepcopy(data.raw["electric-pole"]["medium-electric-pole"])

wire_art_pin.name = "wire-art-pin"

wire_art_pin.flags = {
    "placeable-neutral",
    "placeable-off-grid",
    "player-creation"
}

wire_art_pin.pictures = {
    filename = "__core__/graphics/empty.png",
    priority = "extra-high",
    width = 1,
    height = 1,
    direction_count = 1,
    shift = { 0, 0 }
}

wire_art_pin.selectable_in_game = false
wire_art_pin.selection_box = nil

wire_art_pin.gui_mode = "none"
wire_art_pin.collision_box = { { -0, -0 }, { 0, 0 } }
wire_art_pin.collision_mask = { layers = {} }

local center_point = { 0, 0 }
wire_art_pin.connection_points = {
    {
        shadow = {
            copper = center_point,
            red = center_point,
            green = center_point
        },
        wire = {
            copper = center_point,
            red = center_point,
            green = center_point
        }
    }
}
wire_art_pin.wire_offsets = { center_point }
wire_art_pin.supply_area_distance = 0
wire_art_pin.energy_source = { type = "void" }
wire_art_pin.active_hints = {}
wire_art_pin.maximum_wire_distance = 64
wire_art_pin.auto_connect_up_to_n_wires = 0

data:extend({
    {
        type = "item",
        name = "wire-art-pin",
        icon = "__core__/graphics/empty.png",
        icon_size = 64,
        subgroup = "other",
        order = "z-z-z",
        place_result = "wire-art-pin",
        stack_size = 100
    }
})
wire_art_pin.minable = {
    mining_time = 0.5,
}

data:extend({ wire_art_pin })
