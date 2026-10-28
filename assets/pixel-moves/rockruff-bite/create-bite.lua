-- Rockruff Bite, authored in Aseprite. Run with:
-- aseprite -b --script assets/pixel-moves/rockruff-bite/create-bite.lua
local OUT = "assets/pixel-moves/rockruff-bite/rockruff-bite.aseprite"
local W, H = 128, 96
local fps = 12
local palette = {
  "#241d2d", -- deep plum outline / mouth
  "#603344", -- wine shadow
  "#a64d48", -- warm jaw
  "#e69b55", -- tawny highlight
  "#fff0c6"  -- fang glint
}

local function color(hex)
  return Color(tonumber(hex:sub(2, 3), 16), tonumber(hex:sub(4, 5), 16),
               tonumber(hex:sub(6, 7), 16), 255)
end
local colors = {}
for i, hex in ipairs(palette) do colors[i] = color(hex) end
local transparent = Color(0, 0, 0, 0)
local sprite = Sprite(W, H, ColorMode.RGB)
local upper = sprite.layers[1]
upper.name = "Upper jaw · plum / tawny"
local lower = sprite:newLayer()
lower.name = "Lower jaw · moving"
local fangs = sprite:newLayer()
fangs.name = "Ivory fangs + snap glints"

local function put(image, x, y, c)
  x, y = math.floor(x + 0.5), math.floor(y + 0.5)
  if x >= 0 and x < W and y >= 0 and y < H then image:putPixel(x, y, c) end
end

local function line(image, x1, y1, x2, y2, c)
  x1, y1, x2, y2 = math.floor(x1 + 0.5), math.floor(y1 + 0.5), math.floor(x2 + 0.5), math.floor(y2 + 0.5)
  local dx, sx = math.abs(x2 - x1), x1 < x2 and 1 or -1
  local dy, sy = -math.abs(y2 - y1), y1 < y2 and 1 or -1
  local err = dx + dy
  while true do
    put(image, x1, y1, c)
    if x1 == x2 and y1 == y2 then break end
    local e2 = 2 * err
    if e2 >= dy then err = err + dy; x1 = x1 + sx end
    if e2 <= dx then err = err + dx; y1 = y1 + sy end
  end
end

local function polygon(image, points, c)
  local minY, maxY = H, 0
  for _, p in ipairs(points) do minY = math.min(minY, p[2]); maxY = math.max(maxY, p[2]) end
  for y = math.max(0, minY), math.min(H - 1, maxY) do
    local scan, hits = y + 0.5, {}
    for i = 1, #points do
      local a, b = points[i], points[(i % #points) + 1]
      if (a[2] <= scan and b[2] > scan) or (b[2] <= scan and a[2] > scan) then
        hits[#hits + 1] = a[1] + (scan - a[2]) * (b[1] - a[1]) / (b[2] - a[2])
      end
    end
    table.sort(hits)
    for i = 1, #hits - 1, 2 do
      for x = math.max(0, math.floor(hits[i])), math.min(W - 1, math.ceil(hits[i + 1]) - 1) do put(image, x, y, c) end
    end
  end
  for i = 1, #points do
    local a, b = points[i], points[(i % #points) + 1]
    line(image, a[1], a[2], b[1], b[2], colors[1])
  end
end

local function moved(points, dx, dy)
  local out = {}
  for i, p in ipairs(points) do out[i] = {p[1] + dx, p[2] + dy} end
  return out
end

local function addCel(layer, frame, image)
  local existing = layer:cel(frame)
  if existing then
    existing.image = image
    existing.position = Point(0, 0)
  else
    sprite:newCel(layer, frame, image, Point(0, 0))
  end
end

-- The jaw opens, clamps shut, then relaxes to create a clean looping snap.
local closure = {0.04, 0.08, 0.22, 0.5, 0.82, 1.0, 1.0, 0.78, 0.48, 0.2, 0.08, 0.04}
for frame = 1, #closure do
  if frame > 1 then sprite:newFrame() end
  sprite.frames[frame].duration = 1 / fps
  local open = 1 - closure[frame]
  local up = math.floor(open * 7 + 0.5)
  local down = math.floor(open * 13 + 0.5)
  local lunge = math.floor(closure[frame] * 7 + 0.5)
  local upperImage = Image(W, H, ColorMode.RGB)
  local lowerImage = Image(W, H, ColorMode.RGB)
  local fangImage = Image(W, H, ColorMode.RGB)
  upperImage:clear(transparent); lowerImage:clear(transparent); fangImage:clear(transparent)

  -- The dark cavity makes the teeth read as a bite, not a pair of lips.
  polygon(upperImage, moved({
    {49,41-up},{62,39-up},{78,42-up},{96,45-up},
    {95,51+down},{78,52+down},{59,49+down}
  }, lunge, 0), colors[1])

  if frame >= 4 and frame <= 8 then
    local trail = frame == 6 and colors[5] or colors[3]
    line(upperImage, 7, 34, 23 + lunge, 34, trail)
    line(upperImage, 11, 40, 26 + lunge, 40, colors[4])
    line(upperImage, 8, 47, 22 + lunge, 47, colors[2])
  end

  local top = {
    {28,43-up},{36,33-up},{51,26-up},{68,25-up},{84,30-up},
    {98,38-up},{104,44-up},{97,48-up},{82,44-up},{66,41-up},
    {51,43-up},{38,48-up}
  }
  polygon(upperImage, moved(top, lunge, 0), colors[2])
  local topFill = {
    {34,42-up},{40,35-up},{53,29-up},{68,28-up},{82,33-up},
    {95,40-up},{97,43-up},{94,44-up},{81,40-up},{66,38-up},
    {52,40-up},{40,45-up}
  }
  polygon(upperImage, moved(topFill, lunge, 0), colors[3])
  local topLight = {
    {40,36-up},{52,30-up},{67,28-up},{80,32-up},{91,37-up},
    {81,35-up},{68,32-up},{55,33-up},{46,39-up}
  }
  polygon(upperImage, moved(topLight, lunge, 0), colors[4])
  -- Ear-like hinge and the short snout make the jaw read as a Pokémon bite.
  polygon(upperImage, moved({{28,43-up},{34,34-up},{32,26-up},{41,32-up},{43,42-up}}, lunge, 0), colors[2])
  polygon(upperImage, moved({{31,40-up},{35,34-up},{35,30-up},{39,35-up},{40,41-up}}, lunge, 0), colors[4])
  line(upperImage, 95 + lunge, 39-up, 101 + lunge, 42-up, colors[5])
  line(upperImage, 46 + lunge, 35-up, 51 + lunge, 34-up, colors[1])

  local bottom = {
    {31,51+down},{40,48+down},{56,49+down},{73,52+down},
    {88,49+down},{101,45+down},{104,50+down},{97,61+down},
    {83,68+down},{66,71+down},{50,67+down},{38,60+down}
  }
  polygon(lowerImage, moved(bottom, lunge, 0), colors[2])
  local bottomFill = {
    {37,53+down},{43,51+down},{56,52+down},{72,55+down},
    {87,52+down},{98,49+down},{99,51+down},{94,59+down},
    {82,64+down},{66,67+down},{51,64+down},{42,59+down}
  }
  polygon(lowerImage, moved(bottomFill, lunge, 0), colors[3])
  local bottomLight = {
    {45,54+down},{57,55+down},{71,57+down},{85,55+down},
    {95,52+down},{89,58+down},{78,61+down},{65,63+down},
    {53,61+down},{46,58+down}
  }
  polygon(lowerImage, moved(bottomLight, lunge, 0), colors[4])
  line(lowerImage, 43 + lunge, 60+down, 53 + lunge, 64+down, colors[2])

  -- Four large, readable interlocking fangs; outlines keep them crisp on any backdrop.
  local teeth = {
    {{59,40-up},{66,42-up},{65,49-up}},
    {{78,42-up},{85,44-up},{82,51-up}},
    {{47,52+down},{54,53+down},{53,46+down}},
    {{68,54+down},{76,54+down},{73,46+down}},
    {{88,51+down},{95,49+down},{91,45+down}}
  }
  for _, tooth in ipairs(teeth) do
    tooth = moved(tooth, lunge, 0)
    local expanded = {{tooth[1][1]-1,tooth[1][2]-1},{tooth[2][1]+1,tooth[2][2]-1},{tooth[3][1],tooth[3][2]+1}}
    polygon(fangImage, expanded, colors[1])
    polygon(fangImage, tooth, colors[5])
    line(fangImage, tooth[1][1], tooth[1][2], tooth[3][1], tooth[3][2], colors[5])
  end

  -- Brief warm snap marks only at contact; no noisy particles around the whole sprite.
  if frame == 5 or frame == 6 or frame == 7 then
    local flicker = frame == 6 and colors[5] or colors[4]
    line(fangImage, 106 + lunge, 40, 111 + lunge, 36, flicker)
    line(fangImage, 108 + lunge, 47, 115 + lunge, 47, flicker)
    line(fangImage, 106 + lunge, 54, 111 + lunge, 58, flicker)
    put(fangImage, 116 + lunge, 42, colors[4]); put(fangImage, 115 + lunge, 52, colors[4])
  end

  addCel(upper, frame, upperImage)
  addCel(lower, frame, lowerImage)
  addCel(fangs, frame, fangImage)
end

local tag = sprite:newTag(1, #closure)
tag.name = "Bite · snap loop"

local asePalette = Palette(#palette + 1)
asePalette:setColor(0, Color(0, 0, 0, 0))
for i, hex in ipairs(palette) do asePalette:setColor(i, color(hex)) end
sprite:setPalette(asePalette)
sprite.filename = OUT
assert(sprite:saveAs(OUT), "Failed to save Aseprite bite project")
print("Saved " .. OUT .. " with " .. #closure .. " frames at " .. fps .. " FPS")
