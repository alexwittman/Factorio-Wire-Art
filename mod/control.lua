commands.add_command("build-wire-art", "Queues wire art", function(cmd)
    local player = cmd.player_index and game.players[cmd.player_index]
    if not player then
        game.print("Error: Wire art must be built by a player.")
        return
    end

    local status, func = pcall(load, "return " .. (cmd.parameter or ""))
    if not status or not func then
        player.print("Error: Failed to parse wire art data")
        return
    end

    local status, job_data = pcall(func)
    if not status then
        player.print("Error: Failed to process wire art data")
        return
    end

    local poles = {}
    local success = true
    for _, pin in ipairs(job_data.pins) do
        local pos = { x = player.position.x + pin.x, y = player.position.y + pin.y }
        local pole = player.surface.create_entity {
            name = "wire-art-pin",
            position = pos,
            force = player.force,
            create_build_effect_smoke = false
        }

        if not pole then
            success = false
            break
        else
            table.insert(poles, pole)
        end
    end

    if not success then
        player.print("Error: Failed to place all wire art poles")
        for _, pole in poles do
            pole.destroy()
        end
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

    local job_valid = true;
    for _, pole in ipairs(job.poles) do
        if not pole or not pole.valid then
            job_valid = false
            break
        end
    end

    if not job_valid then
        for _, pole in ipairs(job.poles) do
            if pole then
                pole.destroy()
            end
        end
        finished = true
    else
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
    end

    if finished then
        table.remove(storage.wire_art_queue, 1)
    end
end)
