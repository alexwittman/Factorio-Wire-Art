commands.add_command("build-wire-art", "Queues wire art", function(cmd)
    local func = load("return " .. cmd.parameter)
    if not func then return end
    local job_data = func()

    local poles = {}
    for _, pin in ipairs(job_data.pins) do
        table.insert(poles, game.player.surface.create_entity {
            name = "wire-art-pin",
            position = { x = game.player.position.x + pin.x, y = game.player.position.y + pin.y },
            force = game.player.force,
            create_build_effect_smoke = false
        })
    end

    storage.wire_art_queue = storage.wire_art_queue or {}
    table.insert(storage.wire_art_queue, {
        poles = poles,
        groups = job_data.groups,
        connections_per_tick = job_data.connections_per_tick,
        group_indices = {}
    })
    for i = 1, #job_data.groups do storage.wire_art_queue[#storage.wire_art_queue].group_indices[i] = 1 end
end)

script.on_event(defines.events.on_tick, function(event)
    if not storage.wire_art_queue or #storage.wire_art_queue == 0 then return end
    local job = storage.wire_art_queue[1]
    local finished = true

    -- TODO: Add check to ensure all pins are still intact. Otherwise cancel the job and remove all poles

    for g_idx, group in ipairs(job.groups) do
        local idx = job.group_indices[g_idx]
        if idx <= #group.pairs then
            finished = false
            local limit = math.min(idx + job.connections_per_tick - 1, #group.pairs)
            for i = idx, limit do
                local pair = group.pairs[i]
                local p1, p2 = job.poles[pair[1]], job.poles[pair[2]]
                if p1 and p2 then
                    local c1, c2 = p1.get_wire_connector(group.type, true), p2.get_wire_connector(group.type, true)
                    if c1 and c2 then c1.connect_to(c2, false) end
                end
            end
            job.group_indices[g_idx] = limit + 1
        end
    end

    if finished then
        table.remove(storage.wire_art_queue, 1)
    end
end)
