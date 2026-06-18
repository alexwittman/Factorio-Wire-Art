local function build_frame(surface, player_pos, job_data)
    local poles = {}
    for _, pin in ipairs(job_data.pins) do
        local pos = { x = player_pos.x + pin.x, y = player_pos.y + pin.y }
        local pole = surface.create_entity {
            name = "wire-art-pin",
            position = pos,
            force = job_data.force,
            create_build_effect_smoke = false
        }
        if not pole then
            for _, p in ipairs(poles) do p.destroy() end
            return nil
        end
        table.insert(poles, pole)
    end

    return {
        poles = poles,
        groups = job_data.groups,
        connections_per_tick = job_data.connections_per_tick,
        group_indices = {}
    }
end

commands.add_command("build-wire-art", "Queues wire art", function(cmd)
    local player = cmd.player_index and game.players[cmd.player_index]
    if not player then return end

    local status, func = pcall(load, "return " .. (cmd.parameter or ""))
    if not status or not func then return end
    local _, job_data = pcall(func)

    job_data.force = player.force
    local job = build_frame(player.surface, player.position, job_data)

    if job then
        storage.wire_art_queue = storage.wire_art_queue or {}
        for i = 1, #job.groups do job.group_indices[i] = 1 end
        table.insert(storage.wire_art_queue, job)
    else
        player.print("Error: Failed to place all wire art poles")
    end
end)

script.on_event(defines.events.on_tick, function(event)
    if not storage.wire_art_queue or #storage.wire_art_queue == 0 then return end
    local job = storage.wire_art_queue[1]

    local job_valid = true
    for _, pole in ipairs(job.poles) do
        if not pole or not pole.valid then
            job_valid = false
            break
        end
    end

    if not job_valid then
        for _, pole in ipairs(job.poles) do if pole and pole.valid then pole.destroy() end end
        table.remove(storage.wire_art_queue, 1)
    else
        local finished = true
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
        if finished then table.remove(storage.wire_art_queue, 1) end
    end
end)

commands.add_command("register-wire-art-animation", "Registers a wire art animation", function(cmd)
    local player = cmd.player_index and game.players[cmd.player_index]
    if not player then return end
    local _, func = pcall(load, "return " .. (cmd.parameter or ""))
    local _, animation_data = pcall(func)

    storage.wire_art_animations = storage.wire_art_animations or {}
    table.insert(storage.wire_art_animations, {
        frames = animation_data.frames,
        current_frame_index = 0,
        poles = {},
        position = { x = player.position.x, y = player.position.y },
        surface = player.surface.name,
        force = player.force
    })
end)

script.on_nth_tick(60, function(event)
    if not storage.wire_art_animations then return end

    for i = #storage.wire_art_animations, 1, -1 do
        local anim = storage.wire_art_animations[i]

        local valid = true
        for _, p in ipairs(anim.poles) do
            if not p.valid then
                valid = false
                break
            end
        end

        for _, p in ipairs(anim.poles) do
            if p.valid then p.destroy() end
        end

        if not valid then
            table.remove(storage.wire_art_animations, i)
        else
            anim.current_frame_index = (anim.current_frame_index % #anim.frames) + 1
            local frame = anim.frames[anim.current_frame_index]
            frame.force = anim.force

            local job = build_frame(game.surfaces[anim.surface], anim.position, frame)

            if not job then
                table.remove(storage.wire_art_animations, i)
            else
                for _, group in ipairs(job.groups) do
                    for _, pair in ipairs(group.pairs) do
                        local p1, p2 = job.poles[pair[1]], job.poles[pair[2]]
                        local c1 = p1.get_wire_connector(group.type, true)
                        local c2 = p2.get_wire_connector(group.type, true)
                        if c1 and c2 then c1.connect_to(c2, false) end
                    end
                end
                anim.poles = job.poles
            end
        end
    end
end)
