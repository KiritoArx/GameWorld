local UILibrary = loadstring(game:HttpGet("https://raw.githubusercontent.com/zxcursedsocute/UI-Library/refs/heads/main/UI-Library.txt"))()
local windows = UILibrary.CreateWindow("CRUMB HUB", "", "590", "STA")
local Players     = game:GetService("Players")
local RunService  = game:GetService("RunService")
local UIS         = game:GetService("UserInputService")
local Lighting    = game:GetService("Lighting")
local VirtualUser = game:GetService("VirtualUser")
local Workspace   = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local player = Players.LocalPlayer
local mobCache = {}
local _cacheAddConn, _cacheRemConn
local function isAliveNPC(model)
if not (model and model:IsA("Model") and model.Parent) then return false end
if Players:GetPlayerFromCharacter(model) then return false end
local hum = model:FindFirstChildOfClass("Humanoid")
return hum and hum.Health > 0
end
local function setupMobCache()
mobCache = {}
if _cacheAddConn then _cacheAddConn:Disconnect() end
if _cacheRemConn then _cacheRemConn:Disconnect() end
local folder = Workspace:FindFirstChild("Characters")
if not folder then return end
for _, child in ipairs(folder:GetChildren()) do
if isAliveNPC(child) then mobCache[child] = true end
end
_cacheAddConn = folder.ChildAdded:Connect(function(child)
task.wait(0.2)
if isAliveNPC(child) then mobCache[child] = true end
end)
_cacheRemConn = folder.ChildRemoved:Connect(function(child)
mobCache[child] = nil
end)
end
setupMobCache()
task.spawn(function()
local folder = Workspace:WaitForChild("Characters", 30)
if folder and not _cacheAddConn then setupMobCache() end
end)
player.CharacterAdded:Connect(function()
task.wait(1)
setupMobCache()
end)
local function getSortedMobs(priority, fromPos)
local char = player.Character
local out = {}
for model in pairs(mobCache) do
if not (model and model.Parent) or model == char then
mobCache[model] = nil; continue
end
local hum = model:FindFirstChildOfClass("Humanoid")
local hrp = model:FindFirstChild("HumanoidRootPart")
if not (hum and hum.Health > 0 and hrp) then
mobCache[model] = nil; continue
end
table.insert(out, {
model = model,
hrp   = hrp,
dist  = (hrp.Position - fromPos).Magnitude,
hp    = hum.Health,
})
end
if priority == "Lowest HP" then
table.sort(out, function(a, b) return a.hp < b.hp end)
elseif priority == "Highest HP" then
table.sort(out, function(a, b) return a.hp > b.hp end)
else
table.sort(out, function(a, b) return a.dist < b.dist end)
end
return out
end
local Home = windows:AddTab("Home", "Home")
Home:AddSection("ESP")
local MAX_DISTANCE = 333
local Toggles = {
Weapon=false, Breakable=false, Item=false,
Gun=false, Med=false, Ammo=false, Fuel=false,
Food=false, Crate=false, Battery=false,
Armor=false, Throwable=false, Backpack=false,
Zombie=false
}
local ESP_TYPES = {
Weapon    = { color=Color3.fromRGB(255,50,50),   list={"Bat","Knife","Crowbar","Spiked Bat","Spear","Hatchet","Katana","Fire Axe","Sledgehammer","Riot Shield","Scythe","Dark Scythe","Bloodthirster","Chainsaw"} },
Breakable = { color=Color3.fromRGB(200,200,200), list={"Barrel","Military Box","Scrap Pile","Refined Scrap Pile"} },
Item      = { color=Color3.fromRGB(255,255,0),   list={"Scrap","Tray","Reactor Component","Screws","Spatula","Dumbell","Refined Metal","Bucket","Watch","TV","AC"} },
Gun       = { color=Color3.fromRGB(150,75,0),    list={"Pistol","Minigun","Medi Gun","Revolver","Uzi","Shotgun","Rifle","Assault Rifle","Double Barrel","Ak-47","Sniper","SVD","Combat SMG","AA-12","LMG","Desert Eagle","Heavy Sniper","Ray Gun","Flamethrower","Grenade Launcher"} },
Med       = { color=Color3.fromRGB(0,255,100),   list={"Bandage","Medkit","Compound R","Compound I","Compound S"} },
Ammo      = { color=Color3.fromRGB(180,180,180), list={"Long Ammo","Medium Ammo","Shells","Pistol Ammo","Ammo Box"} },
Fuel      = { color=Color3.fromRGB(0,200,255),   list={"Fuel","Refined Fuel","Nuclear Fuel"} },
Food      = { color=Color3.fromRGB(255,140,0),   list={"Carrot","Bloxy Cola","Bloxiade","Beans","Chips","MRE"} },
Crate     = { color=Color3.fromRGB(255,165,0),   list={"Crate","Chest","Box","Loot","Supply","MysteryBoxes","Better Crate","Emerald","Reactor Crate"} },
Battery   = { color=Color3.fromRGB(170,0,255),   list={"Battery","Battery Pack"} },
Armor     = { color=Color3.fromRGB(255,105,180), list={"Light Armor","Medium Armor","Heavy Armor","Power Armor","Gas Mask"} },
Throwable = { color=Color3.fromRGB(210,180,140), list={"Grenade","Molotov","Flashbang","Tear Gas"} },
Backpack  = { color=Color3.fromRGB(0,255,200),   list={"Basic Backpack","Good Backpack","Great Backpack"} },
}
local espList  = {}
local espCache = {}
local function getType(name)
if espCache[name] then return espCache[name][1], espCache[name][2] end
local lname = string.lower(name)
for t, data in pairs(ESP_TYPES) do
for _, n in ipairs(data.list) do
if string.find(lname, string.lower(n)) then
espCache[name] = {t, data.color}
return t, data.color
end
end
end
end
local function getRoot(obj)
if obj:IsA("BasePart") then return obj end
if obj:IsA("Model") then return obj.PrimaryPart or obj:FindFirstChildWhichIsA("BasePart", true) end
end
local function createESP(obj, typeOverride, colorOverride)
if espList[obj] then return end
local t, color
if typeOverride then
t, color = typeOverride, colorOverride
else
t, color = getType(obj.Name)
end
if not t then return end
local root = getRoot(obj)
if not root then return end
local gui = Instance.new("BillboardGui")
gui.Size = UDim2.new(0, 110, 0, 30)
gui.AlwaysOnTop = true
gui.StudsOffset = Vector3.new(0, 2, 0)
gui.MaxDistance = MAX_DISTANCE
gui.Parent = root
local text = Instance.new("TextLabel")
text.Size = UDim2.new(1, 0, 1, 0)
text.BackgroundTransparency = 1
text.TextColor3 = color
text.TextScaled = true
text.Font = Enum.Font.GothamBold
text.Parent = gui
espList[obj] = { gui=gui, text=text, type=t, root=root }
end
local function scanZombies()
local folder = Workspace:FindFirstChild("Characters")
if not folder then return end
for _, v in ipairs(folder:GetChildren()) do
if v:IsA("Model") and v ~= player.Character and v:FindFirstChild("Humanoid") then
if not espList[v] then
local root = getRoot(v)
if not root then continue end
local gui = Instance.new("BillboardGui")
gui.Size = UDim2.new(0, 110, 0, 30)
gui.AlwaysOnTop = true
gui.StudsOffset = Vector3.new(0, 3, 0)
gui.MaxDistance = MAX_DISTANCE
gui.Parent = root
local text = Instance.new("TextLabel")
text.Size = UDim2.new(1, 0, 1, 0)
text.BackgroundTransparency = 1
text.TextColor3 = Color3.fromRGB(255, 0, 0)
text.TextScaled = true
text.Font = Enum.Font.GothamBold
text.Parent = gui
espList[v] = { gui=gui, text=text, type="Zombie", root=root }
end
end
end
end
RunService.RenderStepped:Connect(function()
local char = player.Character
local hrp  = char and char:FindFirstChild("HumanoidRootPart")
if not hrp then return end
if Toggles.Zombie then scanZombies() end
for obj, data in pairs(espList) do
if not obj or not obj.Parent then
data.gui:Destroy()
espList[obj] = nil
else
local dist = (hrp.Position - data.root.Position).Magnitude
if dist <= MAX_DISTANCE and Toggles[data.type] then
data.gui.Enabled = true
data.text.Text = obj.Name .. " [" .. math.floor(dist) .. "m]"
else
data.gui.Enabled = false
end
end
end
end)
local TARGET_FOLDERS = {"DroppedItems","Structures","Packages","Items","Characters"}
local function connectFolder(folder)
for _, v in ipairs(folder:GetDescendants()) do createESP(v) end
folder.DescendantAdded:Connect(function(v) createESP(v) end)
end
task.spawn(function()
for _, name in ipairs(TARGET_FOLDERS) do
local f = Workspace:FindFirstChild(name)
if f then connectFolder(f) end
end
end)
Workspace.ChildAdded:Connect(function(c)
if table.find(TARGET_FOLDERS, c.Name) then connectFolder(c) end
end)
Home:AddToggle({ Name="Weapon ESP",    Callback=function(v) Toggles.Weapon=v    end })
Home:AddToggle({ Name="Zombie ESP",    Callback=function(v) Toggles.Zombie=v    end })
Home:AddToggle({ Name="Breakable ESP", Callback=function(v) Toggles.Breakable=v end })
Home:AddToggle({ Name="Item ESP",      Callback=function(v) Toggles.Item=v      end })
Home:AddToggle({ Name="Gun ESP",       Callback=function(v) Toggles.Gun=v       end })
Home:AddToggle({ Name="Med ESP",       Callback=function(v) Toggles.Med=v       end })
Home:AddToggle({ Name="Ammo ESP",      Callback=function(v) Toggles.Ammo=v      end })
Home:AddToggle({ Name="Fuel ESP",      Callback=function(v) Toggles.Fuel=v      end })
Home:AddToggle({ Name="Food ESP",      Callback=function(v) Toggles.Food=v      end })
Home:AddToggle({ Name="Crate ESP",     Callback=function(v) Toggles.Crate=v     end })
Home:AddToggle({ Name="Battery ESP",   Callback=function(v) Toggles.Battery=v   end })
Home:AddToggle({ Name="Armor ESP",     Callback=function(v) Toggles.Armor=v     end })
Home:AddToggle({ Name="Throwable ESP", Callback=function(v) Toggles.Throwable=v end })
Home:AddToggle({ Name="Backpack ESP",  Callback=function(v) Toggles.Backpack=v  end })
local Player = windows:AddTab("Player", "Player")
Player:AddSection("Movement")
local noclip  = false
local speed   = false
local infjump = false
RunService.Stepped:Connect(function()
if not noclip then return end
local char = player.Character
if not char then return end
for _, v in pairs(char:GetDescendants()) do
if v:IsA("BasePart") then v.CanCollide = false end
end
end)
RunService.RenderStepped:Connect(function()
local char = player.Character
local hum  = char and char:FindFirstChildOfClass("Humanoid")
if not hum then return end
hum.WalkSpeed = speed and 30 or 16
end)
UIS.JumpRequest:Connect(function()
if not infjump then return end
local char = player.Character
local hum  = char and char:FindFirstChild("Humanoid")
if hum then hum:ChangeState(Enum.HumanoidStateType.Jumping) end
end)
Player:AddButton({
Name = "Teleport Base",
Description = "Teleport back to base",
Callback = function()
local char = player.Character
local hrp  = char and char:FindFirstChild("HumanoidRootPart")
if hrp then hrp.CFrame = hrp.CFrame * CFrame.new(0, -200, 0) end
end,
})
Player:AddToggle({ Name="Noclip",        Description="Walk through walls",   Callback=function(v) noclip=v  end })
Player:AddToggle({ Name="Speed x2",      Description="Double walk speed",    Callback=function(v) speed=v   end })
Player:AddToggle({ Name="Infinite Jump", Description="Jump forever",         Callback=function(v) infjump=v end })
Player:AddSection("Item Pickup")
local PickUpItem = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Interaction"):WaitForChild("PickUpItem")
local AdjustBackpack = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Tools"):WaitForChild("AdjustBackpack")
local itemReturnCFrame = nil
local autoPickupItems = false
local autoPullItems = false
local itemPickupBusy = false
local ITEM_PICKUP_RANGE = 350
local ITEM_PICKUP_DELAY = 0.18
local ITEM_RETURN_DELAY = 0.15
local ITEM_PULL_RANGE = 350
local ITEM_PULL_OFFSET = CFrame.new(0, 1.5, -4)
local ITEM_PULL_STEPS = 8
local ITEM_PULL_STEP_DELAY = 0.04
local ITEM_TARGET_NAMES = {
["ac"] = true,
["battery"] = true,
["battery pack"] = true,
["bucket"] = true,
["dumbell"] = true,
["exhaust pipe"] = true,
["fuel"] = true,
["nuclear fuel"] = true,
["reactor component"] = true,
["refined fuel"] = true,
["refined metal"] = true,
["satellite dish"] = true,
["scrap"] = true,
["screws"] = true,
["spatula"] = true,
["tray"] = true,
["tv"] = true,
["watch"] = true,
["zombie heart"] = true,
}
local ITEM_SKIP_NAMES = {
["ammo"] = true,
["ammo box"] = true,
["long ammo"] = true,
["medium ammo"] = true,
["pistol ammo"] = true,
["shells"] = true,
}
local function getPlayerRoot()
local char = player.Character
return char and char:FindFirstChild("HumanoidRootPart")
end
local function getDroppedItemsFolder()
return Workspace:FindFirstChild("DroppedItems")
end
local function getPickupRoot(item)
if not item or not item.Parent then return nil end
return getRoot(item)
or item:FindFirstChild("Handle", true)
or item:FindFirstChildWhichIsA("BasePart", true)
end
local function getItemStats(item)
return item and item:FindFirstChild("Stats")
end
local function normalizedItemName(item)
return string.lower(tostring(item and item.Name or ""))
end
local function isAmmoPickup(item)
local name = normalizedItemName(item)
if ITEM_SKIP_NAMES[name] then return true end
if string.find(name, "ammo", 1, true) then return true end
if string.find(name, "shell", 1, true) then return true end
return item and item:GetAttribute("ItemType") == "Ammo"
end
local function isMaterialPickup(item)
if not item then return false end
local itemType = item:GetAttribute("ItemType")
if itemType == "Fuel" or itemType == "Resource" then return true end
if ITEM_TARGET_NAMES[normalizedItemName(item)] then return true end
local stats = getItemStats(item)
return stats and (
stats:GetAttribute("Scrap") ~= nil
or stats:GetAttribute("Batteries") ~= nil
or stats:GetAttribute("Hearts") ~= nil
)
end
local function getPickupPriority(item)
if isAmmoPickup(item) then return nil end
if item:GetAttribute("ItemType") == "Resource" then return 1 end
if normalizedItemName(item) == "scrap" then return 1 end
if item:GetAttribute("ItemType") == "Fuel" then return 2 end
if normalizedItemName(item) == "fuel" then return 2 end
if isMaterialPickup(item) then return 3 end
if item:IsA("Tool") or item:GetAttribute("CanPickUp") then return 4 end
return nil
end
local function isPickupCandidate(item)
if not item or not item.Parent then return false end
return getPickupPriority(item) ~= nil and getPickupRoot(item) ~= nil
end
local function getNearestPickupItem()
local hrp = getPlayerRoot()
local folder = getDroppedItemsFolder()
if not (hrp and folder) then return nil end
local nearestItem, nearestDistance, nearestScore
for _, item in ipairs(folder:GetChildren()) do
if isPickupCandidate(item) then
local root = getPickupRoot(item)
if root then
local distance = (root.Position - hrp.Position).Magnitude
local priority = getPickupPriority(item)
local score = (priority * 10000) + distance
if distance <= ITEM_PICKUP_RANGE and (not nearestScore or score < nearestScore) then
nearestItem = item
nearestDistance = distance
nearestScore = score
end
end
end
end
return nearestItem, nearestDistance
end
local function getDragRemote()
local containers = {
player.Character,
player:FindFirstChild("PlayerScripts"),
player:FindFirstChild("Backpack"),
}
for _, container in ipairs(containers) do
if container then
for _, inst in ipairs(container:GetDescendants()) do
if inst.Name == "DragItem" and inst:IsA("RemoteEvent") then
return inst
end
end
end
end
end
local function getCurrentlyDragging()
return player:FindFirstChild("CurrentlyDragging")
end
local function setDraggingValue(item)
local currentlyDragging = getCurrentlyDragging()
if currentlyDragging and currentlyDragging:IsA("ObjectValue") then
currentlyDragging.Value = item
end
end
local function requestItemDrag(item, root)
local dragRemote = getDragRemote()
local itemDrag = item and item:FindFirstChild("ItemDrag")
local ownershipRemote = itemDrag and itemDrag:FindFirstChild("RequestNetworkOwnership")
if dragRemote then
pcall(function()
dragRemote:FireServer(item, root)
end)
end
if ownershipRemote and ownershipRemote:IsA("RemoteEvent") then
pcall(function()
ownershipRemote:FireServer(root)
end)
end
setDraggingValue(item)
end
local function releaseItemDrag()
local dragRemote = getDragRemote()
if dragRemote then
pcall(function()
dragRemote:FireServer(nil)
end)
end
setDraggingValue(nil)
end
local function loosenItemParts(item)
for _, part in ipairs(item:GetDescendants()) do
if part:IsA("BasePart") then
part.Anchored = false
part.AssemblyLinearVelocity = Vector3.zero
part.AssemblyAngularVelocity = Vector3.zero
end
end
end
local function moveItemToCFrame(item, targetCFrame)
if item:IsA("Model") then
item:PivotTo(targetCFrame)
elseif item:IsA("BasePart") then
item.CFrame = targetCFrame
else
local root = getPickupRoot(item)
if root then
root.CFrame = targetCFrame
end
end
end
local function fireItemCollectRemotes(item)
if isMaterialPickup(item) then
AdjustBackpack:FireServer(item)
task.wait(0.04)
PickUpItem:FireServer(item)
else
PickUpItem:FireServer(item)
task.wait(0.04)
AdjustBackpack:FireServer(item)
end
end
local function pickupItemViaPull(item)
if itemPickupBusy then return false, "busy" end
local hrp = getPlayerRoot()
local root = getPickupRoot(item)
if not (hrp and root and item and item.Parent) then return false, "missing root" end
local distance = (root.Position - hrp.Position).Magnitude
if distance > ITEM_PULL_RANGE then return false, "too far" end
itemPickupBusy = true
local ok, err = pcall(function()
loosenItemParts(item)
requestItemDrag(item, root)
task.wait(0.08)
for _ = 1, ITEM_PULL_STEPS do
local currentRoot = getPlayerRoot()
if not (currentRoot and item.Parent) then break end
moveItemToCFrame(item, currentRoot.CFrame * ITEM_PULL_OFFSET)
task.wait(ITEM_PULL_STEP_DELAY)
end
if item.Parent then
fireItemCollectRemotes(item)
end
end)
releaseItemDrag()
itemPickupBusy = false
if not ok then return false, err end
return true
end
local function pickupItemViaTeleport(item)
if itemPickupBusy then return false, "busy" end
local hrp = getPlayerRoot()
local root = getPickupRoot(item)
if not (hrp and root) then return false, "missing root" end
itemPickupBusy = true
local returnCFrame = itemReturnCFrame or hrp.CFrame
hrp.CFrame = CFrame.new(root.Position + Vector3.new(0, 3, 0))
task.wait(ITEM_PICKUP_DELAY)
fireItemCollectRemotes(item)
task.wait(ITEM_RETURN_DELAY)
local currentRoot = getPlayerRoot()
if currentRoot and returnCFrame then
currentRoot.CFrame = returnCFrame
end
itemPickupBusy = false
return true
end
Player:AddButton({
Name = "Set Return Point",
Description = "Save where item pickup returns",
Callback = function()
local hrp = getPlayerRoot()
if hrp then
itemReturnCFrame = hrp.CFrame
print("[CRUMB HUB] Item return point saved")
end
end,
})
Player:AddButton({
Name = "Pull Nearest Item",
Description = "Bring nearest item to you, then pick it up",
Callback = function()
local item, distance = getNearestPickupItem()
if not item then
warn("[CRUMB HUB] No dropped item found in range")
return
end
local ok, reason = pickupItemViaPull(item)
print("[CRUMB HUB] Pull nearest:", ok, reason or item.Name, distance and math.floor(distance) or "?")
end,
})
Player:AddButton({
Name = "Pickup Nearest Item",
Description = "Teleport to nearest item, pick it up, return",
Callback = function()
local item, distance = getNearestPickupItem()
if not item then
warn("[CRUMB HUB] No dropped item found in range")
return
end
local ok, reason = pickupItemViaTeleport(item)
print("[CRUMB HUB] Pickup nearest:", ok, reason or item.Name, distance and math.floor(distance) or "?")
end,
})
Player:AddToggle({
Name = "Auto Pull Items",
Description = "Loop item pull without teleporting you",
Callback = function(v)
autoPullItems = v
end,
})
Player:AddToggle({
Name = "Auto Pickup Items",
Description = "Loop nearest item pickup and return",
Callback = function(v)
autoPickupItems = v
end,
})
task.spawn(function()
while true do
task.wait(0.35)
if autoPullItems and not itemPickupBusy then
local item = getNearestPickupItem()
if item then
pcall(pickupItemViaPull, item)
end
elseif autoPickupItems and not itemPickupBusy then
local item = getNearestPickupItem()
if item then
pcall(pickupItemViaTeleport, item)
end
end
end
end)
Player:AddSection("Psychic Toolkit")
local psychicLastStatus = "not tried"
local psychicLastBindRequest = 0
local floatingPreviewEnabled = false
local floatingPreviewFolder = nil
local floatingPreviewConn = nil
local psychicSpyEnabled = false
local psychicSpyStartedAt = 0
local psychicSpyLog = {}
local localBoundGuns = {}
local localBoundGunCount = 0
local fakeArsenalTool = nil
local fakeEditorTool = nil
local fakeEditorGui = nil
local fakeEditorSelections = {}
local bindLocalAutoShootGuns
local showFloatingGunPreviews
local openFakePsychicEditor
local PSYCHIC_TOOL_ALIASES = {
["Remote Arsenal"] = {"Remote Arsenal", "Ztool", "ZTool", "ztool"},
["Psychic Editor"] = {"Psychic Editor", "Zpsychiceditor", "ZPsychicEditor", "ZPsychic Editor", "zpsychiceditor"},
}
local function getBackpack()
return player:FindFirstChild("Backpack") or player:WaitForChild("Backpack", 5)
end
local function getPsychicAliases(name)
return PSYCHIC_TOOL_ALIASES[name] or { name }
end
local function isPsychicToolName(name, canonical)
for _, alias in ipairs(getPsychicAliases(canonical)) do
if name == alias then return true end
end
return false
end
local function findToolIn(container, name)
if not container then return nil end
for _, alias in ipairs(getPsychicAliases(name)) do
local direct = container:FindFirstChild(alias)
if direct and direct:IsA("Tool") then return direct end
end
for _, inst in ipairs(container:GetDescendants()) do
if inst:IsA("Tool") then
for _, alias in ipairs(getPsychicAliases(name)) do
if inst.Name == alias then
return inst
end
end
end
end
end
local function findOwnedPsychicTool(name)
local backpack = getBackpack()
return findToolIn(player.Character, name) or findToolIn(backpack, name)
end
local function isFakePsychicTool(tool, canonical)
if not (tool and tool:IsA("Tool")) then return false end
if canonical == "Remote Arsenal" then
return tool:GetAttribute("CRUMB_FakeRemoteArsenal") == true
or tool:GetAttribute("ZPsychicRemoteArsenalVisual") == true
or tool.Name == "ZTool"
end
if canonical == "Psychic Editor" then
return tool:GetAttribute("CRUMB_FakePsychicEditor") == true
or tool.Name == "ZPsychicEditor"
end
return false
end
local function getEquippedTool()
local char = player.Character
if not char then return nil end
for _, tool in ipairs(char:GetChildren()) do
if tool:IsA("Tool") then return tool end
end
end
local function makeFakeToolHandle(color)
local handle = Instance.new("Part")
handle.Name = "Handle"
handle.Size = Vector3.new(1.5, 0.35, 0.75)
handle.Color = color
handle.Material = Enum.Material.Neon
handle.CanCollide = false
handle.CanTouch = false
handle.CanQuery = false
handle.Massless = true
return handle
end
local function wireFakePsychicTool(tool)
if not tool or tool:GetAttribute("CRUMB_FakeWired") then return end
tool:SetAttribute("CRUMB_FakeWired", true)
tool.Equipped:Connect(function()
if isFakePsychicTool(tool, "Psychic Editor") then
task.defer(function()
if openFakePsychicEditor then openFakePsychicEditor() end
end)
return
end
if isFakePsychicTool(tool, "Remote Arsenal") then
if localBoundGunCount == 0 then
bindLocalAutoShootGuns(nil, false)
end
if floatingPreviewEnabled then
showFloatingGunPreviews()
end
psychicLastStatus = "fake arsenal equipped; local bound guns=" .. tostring(localBoundGunCount)
print("[CRUMB HUB] " .. psychicLastStatus)
end
end)
end
local function getOrCreateFakePsychicTool(name)
local backpack = getBackpack()
if not backpack then return nil, "missing Backpack" end
if name == "Remote Arsenal" then
local existing = findToolIn(player.Character, "Remote Arsenal") or findToolIn(backpack, "Remote Arsenal")
if existing and isFakePsychicTool(existing, "Remote Arsenal") then
fakeArsenalTool = existing
wireFakePsychicTool(existing)
return existing, "fake existing"
end
local tool = Instance.new("Tool")
tool.Name = "ZTool"
tool.ToolTip = "Remote Arsenal"
tool.RequiresHandle = true
tool.CanBeDropped = false
tool:SetAttribute("ZPsychicRemoteArsenalVisual", true)
tool:SetAttribute("CRUMB_FakeRemoteArsenal", true)
makeFakeToolHandle(Color3.fromRGB(90, 215, 255)).Parent = tool
tool.Parent = backpack
fakeArsenalTool = tool
wireFakePsychicTool(tool)
return tool, "fake local"
end
if name == "Psychic Editor" then
local existing = findToolIn(player.Character, "Psychic Editor") or findToolIn(backpack, "Psychic Editor")
if existing and isFakePsychicTool(existing, "Psychic Editor") then
fakeEditorTool = existing
wireFakePsychicTool(existing)
return existing, "fake existing"
end
local tool = Instance.new("Tool")
tool.Name = "ZPsychicEditor"
tool.ToolTip = "Psychic Editor"
tool.RequiresHandle = true
tool.CanBeDropped = false
tool:SetAttribute("CRUMB_FakePsychicEditor", true)
makeFakeToolHandle(Color3.fromRGB(210, 140, 255)).Parent = tool
tool.Parent = backpack
fakeEditorTool = tool
wireFakePsychicTool(tool)
return tool, "fake local"
end
end
local function spyFullName(inst)
if typeof(inst) ~= "Instance" then return tostring(inst) end
local ok, value = pcall(function() return inst:GetFullName() end)
return ok and value or tostring(inst.Name)
end
local function spyValue(value)
local t = typeof(value)
if t == "Instance" then return spyFullName(value) end
if t == "Vector3" then return string.format("(%.1f, %.1f, %.1f)", value.X, value.Y, value.Z) end
if type(value) == "table" then return "table[" .. tostring(#value) .. "]" end
return tostring(value)
end
local function spyAttrs(inst)
local ok, attrs = pcall(function() return inst:GetAttributes() end)
if not ok or not attrs then return "" end
local parts = {}
for key, value in pairs(attrs) do
table.insert(parts, tostring(key) .. "=" .. spyValue(value))
end
table.sort(parts)
return table.concat(parts, ", ")
end
local function spyLine(lines, text)
table.insert(lines, text)
end
local function isPsychicScanName(name)
local lower = string.lower(tostring(name or ""))
return lower:find("psychic", 1, true)
or lower:find("ztool", 1, true)
or lower:find("zremote", 1, true)
or lower:find("zarsenal", 1, true)
or lower:find("zeditor", 1, true)
or lower:find("arsenal", 1, true)
or lower:find("setweapons", 1, true)
or lower:find("remote", 1, true)
or lower:find("shoot", 1, true)
end
local function spyInstanceValue(inst)
if inst:IsA("ObjectValue") then
return " Value=" .. spyValue(inst.Value)
end
if inst:IsA("StringValue") or inst:IsA("BoolValue") or inst:IsA("NumberValue") or inst:IsA("IntValue") then
return " Value=" .. spyValue(inst.Value)
end
return ""
end
local function spyDescribeInst(inst)
return inst.ClassName .. " " .. spyFullName(inst) .. spyInstanceValue(inst) .. " attrs={" .. spyAttrs(inst) .. "}"
end
local function spyDeepTool(lines, tool, label)
if not tool then return end
spyLine(lines, label .. ": " .. spyDescribeInst(tool))
local count = 0
for _, desc in ipairs(tool:GetDescendants()) do
count += 1
if count > 80 then
spyLine(lines, "  ...descendants truncated...")
break
end
spyLine(lines, "  " .. spyDescribeInst(desc))
end
end
local function spyScanPsychicObjects(lines)
local roots = {
player,
getBackpack(),
player.Character,
player:FindFirstChild("PlayerGui"),
player:FindFirstChild("PlayerScripts"),
}
local seen = {}
local count = 0
spyLine(lines, "-- Psychic/Z object scan --")
for _, root in ipairs(roots) do
if root then
for _, inst in ipairs(root:GetDescendants()) do
if not seen[inst] and (isPsychicScanName(inst.Name) or inst:IsA("RemoteEvent") or inst:IsA("RemoteFunction")) then
seen[inst] = true
count += 1
if count > 120 then
spyLine(lines, "  ...object scan truncated...")
return
end
spyLine(lines, "  " .. spyDescribeInst(inst))
end
end
end
end
spyLine(lines, "-- scan count: " .. tostring(count) .. " --")
end
local function buildPsychicSnapshot(label)
local lines = {}
spyLine(lines, "=== CRUMB HUB PSYCHIC SNAPSHOT: " .. tostring(label) .. " ===")
spyLine(lines, "Time: " .. tostring(os.date("%X")))
spyLine(lines, "Player attrs: " .. spyAttrs(player))
local char = player.Character
spyLine(lines, "Character: " .. (char and spyFullName(char) or "missing"))
if char then
spyLine(lines, "Character attrs: " .. spyAttrs(char))
end
local backpack = getBackpack()
local gui = player:FindFirstChild("PlayerGui")
local toolUI = gui and gui:FindFirstChild("ToolUI")
local remoteArsenalUI = toolUI and toolUI:FindFirstChild("RemoteArsenal")
local editorUI = toolUI and toolUI:FindFirstChild("PsychicEditor")
spyLine(lines, "RemoteArsenal UI: " .. (remoteArsenalUI and (spyFullName(remoteArsenalUI) .. " Visible=" .. tostring(remoteArsenalUI.Visible)) or "missing"))
spyLine(lines, "PsychicEditor UI: " .. (editorUI and (spyFullName(editorUI) .. " Visible=" .. tostring(editorUI.Visible)) or "missing"))
local function scanTools(container, containerLabel)
if not container then
spyLine(lines, containerLabel .. ": missing")
return
end
spyLine(lines, containerLabel .. ": " .. spyFullName(container))
for _, child in ipairs(container:GetChildren()) do
if child:IsA("Tool") then
spyLine(lines, "Tool: " .. spyFullName(child)
.. " ToolType=" .. tostring(child:GetAttribute("ToolType"))
.. " attrs={" .. spyAttrs(child) .. "}")
local stats = child:FindFirstChild("Stats")
if stats then
spyLine(lines, "  Stats attrs={" .. spyAttrs(stats) .. "}")
end
for _, desc in ipairs(child:GetDescendants()) do
if desc:IsA("RemoteEvent") or desc:IsA("RemoteFunction") then
spyLine(lines, "  Remote: " .. desc.ClassName .. " " .. spyFullName(desc))
end
end
end
end
end
scanTools(backpack, "Backpack")
scanTools(char, "Character")
local arsenalAlias = findOwnedPsychicTool("Remote Arsenal")
local editorAlias = findOwnedPsychicTool("Psychic Editor")
spyLine(lines, "Remote Arsenal alias match: " .. (arsenalAlias and spyFullName(arsenalAlias) or "missing"))
spyLine(lines, "Psychic Editor alias match: " .. (editorAlias and spyFullName(editorAlias) or "missing"))
spyDeepTool(lines, remoteArsenalUI, "RemoteArsenal UI deep")
spyDeepTool(lines, editorUI, "PsychicEditor UI deep")
spyDeepTool(lines, arsenalAlias, "Remote Arsenal alias deep")
spyDeepTool(lines, editorAlias, "Psychic Editor alias deep")
spyScanPsychicObjects(lines)
spyLine(lines, "Last bind request slots: " .. tostring(psychicLastBindRequest))
return lines
end
local function addPsychicSnapshot(label)
if not psychicSpyEnabled then
psychicSpyEnabled = true
psychicSpyStartedAt = os.clock()
psychicSpyLog = {}
end
local lines = buildPsychicSnapshot(label)
for _, line in ipairs(lines) do
print("[CRUMB HUB][PSYCHIC SNAPSHOT] " .. line)
table.insert(psychicSpyLog, line)
end
table.insert(psychicSpyLog, "")
psychicLastStatus = "Psychic snapshot saved: " .. tostring(label)
end
local function resetPsychicSnapshotLog()
psychicSpyEnabled = true
psychicSpyStartedAt = os.clock()
psychicSpyLog = {}
addPsychicSnapshot("baseline")
end
local function copyPsychicSnapshotLog()
local text = table.concat(psychicSpyLog, "\n")
if text == "" then
text = table.concat(buildPsychicSnapshot("current"), "\n")
end
print("=== CRUMB HUB PSYCHIC SNAPSHOT LOG ===\n" .. text)
if type(setclipboard) == "function" then
pcall(setclipboard, "=== CRUMB HUB PSYCHIC SNAPSHOT LOG ===\n" .. text)
end
end
local function getBindableArsenalGuns(limit, allowDuplicates)
local backpack = getBackpack()
local guns = {}
local seen = {}
local sourceGuns = {}
local function scan(container)
if not container then return false end
for _, tool in ipairs(container:GetChildren()) do
local stats = tool:FindFirstChild("Stats")
if tool:IsA("Tool")
and not seen[tool]
and not isPsychicToolName(tool.Name, "Remote Arsenal")
and tool:GetAttribute("ToolType") == "Gun"
and stats
and not stats:GetAttribute("Projectile")
then
seen[tool] = true
table.insert(sourceGuns, tool)
table.insert(guns, tool)
if limit and #guns >= limit then return true end
end
end
end
if scan(backpack) then return guns end
scan(player.Character)
if allowDuplicates and #sourceGuns > 0 then
local target = limit or #sourceGuns
local index = 1
while #guns < target do
table.insert(guns, sourceGuns[index])
index = (index % #sourceGuns) + 1
end
end
return guns
end
function bindLocalAutoShootGuns(limitOverride, allowDuplicates)
local guns = getBindableArsenalGuns(limitOverride, allowDuplicates)
localBoundGuns = guns
localBoundGunCount = #guns
psychicLastBindRequest = #guns
return #guns > 0, string.format("locally bound %d gun slot(s)%s", #guns, allowDuplicates and " with duplicates" or "")
end
local function bindRemoteArsenal(limitOverride, allowDuplicates)
local ok, status = bindLocalAutoShootGuns(limitOverride, allowDuplicates)
if floatingPreviewEnabled then showFloatingGunPreviews() end
return ok, status .. "; fake arsenal only"
end
local function equipPsychicTool(name)
local tool = select(1, getOrCreateFakePsychicTool(name))
local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
if tool and hum then
hum:EquipTool(tool)
return true
end
return false
end
local function setFreePsychicAttrs()
player:SetAttribute("CRUMB_FakePsychic", true)
player:SetAttribute("CRUMB_FakeRemoteArsenalMax", 16)
local char = player.Character
if char then
char:SetAttribute("CRUMB_FakePsychic", true)
char:SetAttribute("CRUMB_FakeRemoteArsenalMax", 16)
end
end
local function bindSelectedFakeEditorGuns()
local guns = {}
for _, gun in ipairs(getBindableArsenalGuns(nil, false)) do
if fakeEditorSelections[gun] then
table.insert(guns, gun)
end
end
localBoundGuns = guns
localBoundGunCount = #guns
psychicLastBindRequest = #guns
psychicLastStatus = string.format("fake editor bound %d gun(s)", #guns)
if floatingPreviewEnabled then showFloatingGunPreviews() end
print("[CRUMB HUB] " .. psychicLastStatus)
return #guns > 0
end
local function rebuildFakePsychicEditorList()
if not fakeEditorGui then return end
local frame = fakeEditorGui:FindFirstChild("Panel")
local list = frame and frame:FindFirstChild("List")
local subtitle = frame and frame:FindFirstChild("Subtitle")
if not list then return end
for _, child in ipairs(list:GetChildren()) do
if child:GetAttribute("CRUMB_Row") then
child:Destroy()
end
end
local guns = getBindableArsenalGuns(nil, false)
if subtitle then
subtitle.Text = string.format("Choose owned guns to control (%d found)", #guns)
end
for _, gun in ipairs(guns) do
if fakeEditorSelections[gun] == nil then
fakeEditorSelections[gun] = true
end
local row = Instance.new("TextButton")
row.Name = "Gun_" .. gun.Name
row:SetAttribute("CRUMB_Row", true)
row.Size = UDim2.new(1, -8, 0, 34)
row.BackgroundColor3 = fakeEditorSelections[gun] and Color3.fromRGB(34, 88, 108) or Color3.fromRGB(34, 34, 40)
row.BorderSizePixel = 0
row.TextColor3 = Color3.fromRGB(245, 248, 255)
row.TextSize = 14
row.Font = Enum.Font.GothamSemibold
row.TextXAlignment = Enum.TextXAlignment.Left
row.AutoButtonColor = true
row.Parent = list
local pad = Instance.new("UIPadding")
pad.PaddingLeft = UDim.new(0, 10)
pad.Parent = row
local function refresh()
local ammo = gun:GetAttribute("Ammo")
local ammoText = typeof(ammo) == "number" and ("  Ammo: " .. tostring(ammo)) or ""
row.Text = string.format("[%s] %s%s", fakeEditorSelections[gun] and "x" or " ", gun.Name, ammoText)
row.BackgroundColor3 = fakeEditorSelections[gun] and Color3.fromRGB(34, 88, 108) or Color3.fromRGB(34, 34, 40)
end
row.MouseButton1Click:Connect(function()
fakeEditorSelections[gun] = not fakeEditorSelections[gun]
refresh()
end)
refresh()
end
list.CanvasSize = UDim2.new(0, 0, 0, math.max(#guns * 38 + 8, 8))
end
local function ensureFakePsychicEditorGui()
local playerGui = player:FindFirstChild("PlayerGui") or player:WaitForChild("PlayerGui", 5)
if not playerGui then return nil end
if fakeEditorGui and fakeEditorGui.Parent then
return fakeEditorGui
end
local gui = Instance.new("ScreenGui")
gui.Name = "CRUMB_PsychicEditorGui"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.Enabled = false
gui.Parent = playerGui
local panel = Instance.new("Frame")
panel.Name = "Panel"
panel.AnchorPoint = Vector2.new(0.5, 0.5)
panel.Position = UDim2.new(0.5, 0, 0.5, 0)
panel.Size = UDim2.new(0, 390, 0, 430)
panel.BackgroundColor3 = Color3.fromRGB(18, 19, 24)
panel.BorderSizePixel = 0
panel.Parent = gui
local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 8)
corner.Parent = panel
local stroke = Instance.new("UIStroke")
stroke.Color = Color3.fromRGB(95, 190, 230)
stroke.Thickness = 1
stroke.Parent = panel
local title = Instance.new("TextLabel")
title.Name = "Title"
title.BackgroundTransparency = 1
title.Position = UDim2.new(0, 18, 0, 14)
title.Size = UDim2.new(1, -70, 0, 28)
title.Text = "Psychic Editor"
title.TextColor3 = Color3.fromRGB(255, 255, 255)
title.TextSize = 22
title.Font = Enum.Font.GothamBold
title.TextXAlignment = Enum.TextXAlignment.Left
title.Parent = panel
local subtitle = Instance.new("TextLabel")
subtitle.Name = "Subtitle"
subtitle.BackgroundTransparency = 1
subtitle.Position = UDim2.new(0, 18, 0, 44)
subtitle.Size = UDim2.new(1, -36, 0, 22)
subtitle.Text = "Choose owned guns to control"
subtitle.TextColor3 = Color3.fromRGB(180, 210, 225)
subtitle.TextSize = 13
subtitle.Font = Enum.Font.Gotham
subtitle.TextXAlignment = Enum.TextXAlignment.Left
subtitle.Parent = panel
local close = Instance.new("TextButton")
close.Name = "Close"
close.AnchorPoint = Vector2.new(1, 0)
close.Position = UDim2.new(1, -12, 0, 12)
close.Size = UDim2.new(0, 34, 0, 30)
close.Text = "X"
close.TextSize = 16
close.Font = Enum.Font.GothamBold
close.TextColor3 = Color3.fromRGB(255, 255, 255)
close.BackgroundColor3 = Color3.fromRGB(52, 52, 60)
close.BorderSizePixel = 0
close.Parent = panel
local closeCorner = Instance.new("UICorner")
closeCorner.CornerRadius = UDim.new(0, 6)
closeCorner.Parent = close
local list = Instance.new("ScrollingFrame")
list.Name = "List"
list.Position = UDim2.new(0, 18, 0, 78)
list.Size = UDim2.new(1, -36, 1, -148)
list.BackgroundColor3 = Color3.fromRGB(24, 25, 31)
list.BorderSizePixel = 0
list.ScrollBarThickness = 5
list.CanvasSize = UDim2.new(0, 0, 0, 0)
list.Parent = panel
local listCorner = Instance.new("UICorner")
listCorner.CornerRadius = UDim.new(0, 6)
listCorner.Parent = list
local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 5)
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.Parent = list
local listPadding = Instance.new("UIPadding")
listPadding.PaddingTop = UDim.new(0, 6)
listPadding.PaddingLeft = UDim.new(0, 4)
listPadding.PaddingRight = UDim.new(0, 4)
listPadding.Parent = list
local selectAll = Instance.new("TextButton")
selectAll.Name = "SelectAll"
selectAll.Position = UDim2.new(0, 18, 1, -52)
selectAll.Size = UDim2.new(0.31, -8, 0, 36)
selectAll.Text = "All"
selectAll.TextSize = 14
selectAll.Font = Enum.Font.GothamBold
selectAll.TextColor3 = Color3.fromRGB(255, 255, 255)
selectAll.BackgroundColor3 = Color3.fromRGB(58, 65, 74)
selectAll.BorderSizePixel = 0
selectAll.Parent = panel
local clear = selectAll:Clone()
clear.Name = "Clear"
clear.Position = UDim2.new(0.345, 0, 1, -52)
clear.Text = "Clear"
clear.Parent = panel
local bind = selectAll:Clone()
bind.Name = "Bind"
bind.Position = UDim2.new(0.67, 0, 1, -52)
bind.Size = UDim2.new(0.33, -18, 0, 36)
bind.Text = "Bind"
bind.BackgroundColor3 = Color3.fromRGB(28, 118, 146)
bind.Parent = panel
for _, button in ipairs({ selectAll, clear, bind }) do
local buttonCorner = Instance.new("UICorner")
buttonCorner.CornerRadius = UDim.new(0, 6)
buttonCorner.Parent = button
end
close.MouseButton1Click:Connect(function()
gui.Enabled = false
end)
selectAll.MouseButton1Click:Connect(function()
for _, gun in ipairs(getBindableArsenalGuns(nil, false)) do
fakeEditorSelections[gun] = true
end
rebuildFakePsychicEditorList()
end)
clear.MouseButton1Click:Connect(function()
for gun in pairs(fakeEditorSelections) do
fakeEditorSelections[gun] = false
end
rebuildFakePsychicEditorList()
end)
bind.MouseButton1Click:Connect(function()
bindSelectedFakeEditorGuns()
gui.Enabled = false
end)
fakeEditorGui = gui
return gui
end
openFakePsychicEditor = function()
getOrCreateFakePsychicTool("Psychic Editor")
local gui = ensureFakePsychicEditorGui()
if not gui then
psychicLastStatus = "fake Psychic Editor UI failed"
warn("[CRUMB HUB] " .. psychicLastStatus)
return false
end
rebuildFakePsychicEditorList()
gui.Enabled = true
psychicLastStatus = "opened fake Psychic Editor UI"
print("[CRUMB HUB] " .. psychicLastStatus)
return true
end
local function openPsychicEditor()
return openFakePsychicEditor()
end
local function getPreviewTools()
local tools = {}
if #localBoundGuns > 0 then
for _, tool in ipairs(localBoundGuns) do
if typeof(tool) == "Instance" and tool:IsA("Tool") and tool.Parent then
table.insert(tools, tool)
end
end
end
if #tools == 0 then
tools = getBindableArsenalGuns(nil, false)
end
return tools
end
local function clearFloatingGunPreviews()
if floatingPreviewConn then
floatingPreviewConn:Disconnect()
floatingPreviewConn = nil
end
if floatingPreviewFolder then
floatingPreviewFolder:Destroy()
floatingPreviewFolder = nil
end
end
local function createPreviewPart(tool)
local model = Instance.new("Model")
model.Name = tool.Name
local sourceParts = {}
for _, inst in ipairs(tool:GetDescendants()) do
if inst:IsA("BasePart") then
table.insert(sourceParts, inst)
end
end
local primary
local sourcePivot = CFrame.new()
local pivotOk, pivotValue = pcall(function()
return tool:GetPivot()
end)
if pivotOk and typeof(pivotValue) == "CFrame" then
sourcePivot = pivotValue
else
local handle = tool:FindFirstChild("Handle") or tool:FindFirstChildWhichIsA("BasePart", true)
if handle and handle:IsA("BasePart") then
sourcePivot = handle.CFrame
end
end
for _, source in ipairs(sourceParts) do
local clone = source:Clone()
clone.Name = source.Name
clone.Anchored = true
clone.CanCollide = false
clone.CanTouch = false
clone.CanQuery = false
clone.Massless = true
clone.Transparency = math.min(clone.Transparency, 0.15)
clone.LocalTransparencyModifier = 0
for _, inst in ipairs(clone:GetDescendants()) do
if inst:IsA("Script") or inst:IsA("LocalScript") or inst:IsA("RemoteEvent") or inst:IsA("RemoteFunction") then
inst:Destroy()
elseif inst:IsA("BasePart") then
inst.Anchored = true
inst.CanCollide = false
inst.CanTouch = false
inst.CanQuery = false
inst.Transparency = math.min(inst.Transparency, 0.15)
inst.LocalTransparencyModifier = 0
end
end
clone.CFrame = source.CFrame
clone.Parent = model
if not primary or source.Name == "Handle" then
primary = clone
end
end
if not primary then
primary = Instance.new("Part")
primary.Name = "PreviewBody"
primary.Size = Vector3.new(1.8, 0.35, 0.75)
primary.Color = Color3.fromRGB(80, 220, 255)
primary.Material = Enum.Material.Neon
primary.Anchored = true
primary.CanCollide = false
primary.CanTouch = false
primary.CanQuery = false
primary.Parent = model
sourcePivot = CFrame.new()
end
model.PrimaryPart = primary
model:SetAttribute("CRUMB_SourcePivot", true)
local highlight = Instance.new("Highlight")
highlight.Name = "CRUMB_VisibleOutline"
highlight.FillTransparency = 0.75
highlight.OutlineTransparency = 0
highlight.FillColor = Color3.fromRGB(50, 190, 230)
highlight.OutlineColor = Color3.fromRGB(170, 245, 255)
highlight.Parent = model
pcall(function()
model:PivotTo(sourcePivot)
end)
return model
end
function showFloatingGunPreviews()
clearFloatingGunPreviews()
floatingPreviewFolder = Instance.new("Folder")
floatingPreviewFolder.Name = "CRUMB_FloatingGunPreviews"
floatingPreviewFolder.Parent = Workspace
local previews = {}
for _, tool in ipairs(getPreviewTools()) do
local preview = createPreviewPart(tool)
preview.Parent = floatingPreviewFolder
table.insert(previews, preview)
if #previews >= 24 then break end
end
if #previews == 0 then
psychicLastStatus = "no guns for floating previews"
warn("[CRUMB HUB] No guns found for floating previews")
return
end
floatingPreviewConn = RunService.RenderStepped:Connect(function()
local hrp = getPlayerRoot()
if not hrp then return end
local count = #previews
local now = os.clock()
for index, preview in ipairs(previews) do
if preview.Parent then
local angle = ((index - 1) / count) * math.pi * 2 + now * 0.75
local radius = 3.2 + math.min(count, 12) * 0.1
local y = 2.2 + math.sin(now * 1.5 + index) * 0.25
local backBias = CFrame.new(0, y, 2.5)
local orbit = CFrame.new(math.cos(angle) * radius, 0, math.sin(angle) * radius * 0.45)
local pos = (hrp.CFrame * backBias * orbit).Position
preview:PivotTo(CFrame.lookAt(pos, hrp.Position + Vector3.new(0, 1.8, 0)) * CFrame.Angles(0, math.rad(90), 0))
end
end
end)
psychicLastStatus = string.format("showing %d floating gun preview(s)", #previews)
print("[CRUMB HUB] " .. psychicLastStatus)
end
local function tryPsychicToolkit()
setFreePsychicAttrs()
local arsenal, arsenalSource = getOrCreateFakePsychicTool("Remote Arsenal")
local editor, editorSource = getOrCreateFakePsychicTool("Psychic Editor")
local bindOk, bindStatus = bindRemoteArsenal(16, true)
equipPsychicTool("Remote Arsenal")
psychicLastStatus = string.format(
"Fake Arsenal=%s (%s), Fake Editor=%s (%s), Bind=%s",
arsenal and "yes" or "NO",
tostring(arsenalSource),
editor and "yes" or "NO",
tostring(editorSource),
bindOk and bindStatus or ("NO: " .. tostring(bindStatus))
)
print("[CRUMB HUB] Psychic toolkit:", psychicLastStatus)
end
Player:AddButton({
Name = "Enable Free Psychic",
Description = "Create fake Psychic tools and locally bind owned guns",
Callback = tryPsychicToolkit,
})
Player:AddButton({
Name = "Open Psychic Editor",
Description = "Open CRUMB's local Psychic-style gun binder",
Callback = function()
openPsychicEditor()
end,
})
Player:AddButton({
Name = "Spawn Psychic Editor Tool",
Description = "Create CRUMB's local editor opener tool",
Callback = function()
local tool, source = getOrCreateFakePsychicTool("Psychic Editor")
if tool then
equipPsychicTool("Psychic Editor")
psychicLastStatus = "Psychic Editor ready from " .. tostring(source)
else
psychicLastStatus = "Psychic Editor template/tool not found"
end
print("[CRUMB HUB] " .. psychicLastStatus)
end,
})
Player:AddToggle({
Name = "Show Floating Gun Previews",
Description = "Local-only orbit preview for bound arsenal guns",
Default = false,
Callback = function(value)
floatingPreviewEnabled = value
if value then
showFloatingGunPreviews()
else
clearFloatingGunPreviews()
psychicLastStatus = "floating gun previews hidden"
print("[CRUMB HUB] " .. psychicLastStatus)
end
end,
})
Player:AddButton({
Name = "Get Psychic Toolkit",
Description = "Create fake visual tools and bind owned guns",
Callback = tryPsychicToolkit,
})
Player:AddButton({
Name = "Bind All Arsenal Guns",
Description = "Locally bind every real inventory gun",
Callback = function()
local ok, status = bindRemoteArsenal()
psychicLastStatus = (ok and "Bind OK: " or "Bind failed: ") .. tostring(status)
if floatingPreviewEnabled then showFloatingGunPreviews() end
print("[CRUMB HUB] " .. psychicLastStatus)
end,
})
Player:AddButton({
Name = "Overbind Arsenal x8",
Description = "Locally bind 8 slots, reusing guns if needed",
Callback = function()
local ok, status = bindRemoteArsenal(8, true)
psychicLastStatus = (ok and "Overbind x8 OK: " or "Overbind x8 failed: ") .. tostring(status)
if floatingPreviewEnabled then showFloatingGunPreviews() end
print("[CRUMB HUB] " .. psychicLastStatus)
end,
})
Player:AddButton({
Name = "Overbind Arsenal x16",
Description = "Locally bind 16 slots, reusing guns if needed",
Callback = function()
local ok, status = bindRemoteArsenal(16, true)
psychicLastStatus = (ok and "Overbind x16 OK: " or "Overbind x16 failed: ") .. tostring(status)
if floatingPreviewEnabled then showFloatingGunPreviews() end
print("[CRUMB HUB] " .. psychicLastStatus)
end,
})
Player:AddButton({
Name = "Start Psychic Snapshot Log",
Description = "Save baseline Psychic tools/UI/attrs",
Callback = function()
local ok, err = pcall(resetPsychicSnapshotLog)
if not ok then
psychicLastStatus = "Psychic snapshot start failed: " .. tostring(err)
warn("[CRUMB HUB] " .. psychicLastStatus)
end
end,
})
Player:AddButton({
Name = "Add Psychic Snapshot",
Description = "Save current Psychic tools/UI/attrs",
Callback = function()
local ok, err = pcall(function() addPsychicSnapshot("manual") end)
if not ok then
psychicLastStatus = "Psychic snapshot failed: " .. tostring(err)
warn("[CRUMB HUB] " .. psychicLastStatus)
end
end,
})
Player:AddButton({
Name = "Copy Psychic Snapshot Log",
Description = "Copy snapshot output to clipboard",
Callback = function()
local ok, err = pcall(copyPsychicSnapshotLog)
if not ok then
psychicLastStatus = "Psychic snapshot copy failed: " .. tostring(err)
warn("[CRUMB HUB] " .. psychicLastStatus)
end
end,
})
Player:AddButton({
Name = "Psychic Diagnostic",
Description = "Copy Psychic toolkit status",
Callback = function()
local visualArsenal = (fakeArsenalTool and fakeArsenalTool.Parent and fakeArsenalTool) or findOwnedPsychicTool("Remote Arsenal")
local visualEditor = (fakeEditorTool and fakeEditorTool.Parent and fakeEditorTool) or findOwnedPsychicTool("Psychic Editor")
local equipped = getEquippedTool()
local boundNames = {}
for _, gun in ipairs(localBoundGuns) do
if typeof(gun) == "Instance" and gun.Parent then
table.insert(boundNames, gun.Name)
end
end
local msg = string.format(
"=== CRUMB HUB PSYCHIC DIAGNOSTIC ===\n" ..
"Last status: %s\n" ..
"FakePsychic attr: %s\n" ..
"Fake Remote Arsenal: %s\n" ..
"Fake Psychic Editor: %s\n" ..
"Equipped tool: %s\n" ..
"Remote Arsenal aliases: %s\n" ..
"Psychic Editor aliases: %s\n" ..
"Last bind request slots: %s\n" ..
"Local bound guns: %s\n" ..
"Local bound names: %s\n" ..
"Floating previews: %s\n" ..
"Real Remote Arsenal path used: no",
tostring(psychicLastStatus),
tostring(player:GetAttribute("CRUMB_FakePsychic")),
visualArsenal and visualArsenal:GetFullName() or "missing",
visualEditor and visualEditor:GetFullName() or "missing",
equipped and equipped:GetFullName() or "none",
table.concat(getPsychicAliases("Remote Arsenal"), ", "),
table.concat(getPsychicAliases("Psychic Editor"), ", "),
tostring(psychicLastBindRequest),
tostring(localBoundGunCount),
#boundNames > 0 and table.concat(boundNames, ", ") or "none",
floatingPreviewEnabled and "on" or "off"
)
print(msg)
if type(setclipboard) == "function" then
pcall(setclipboard, msg)
end
end,
})
local Combat = windows:AddTab("Combat", "Combat")
Combat:AddSection("Kill Aura")
local killaura         = false
local kaTargetPriority = "Nearest"
local KILL_RANGE       = 76
local KILL_DELAY       = 0.1
local activeTool, loopThread = nil, nil
local function stopAura()
if loopThread then pcall(task.cancel, loopThread) loopThread = nil end
activeTool = nil
end
local function startAura(tool)
stopAura()
activeTool = tool
loopThread = task.spawn(function()
while activeTool == tool do
task.wait(KILL_DELAY)
if not killaura then continue end
pcall(function()
local char = player.Character
local hrp  = char and char:FindFirstChild("HumanoidRootPart")
local Swing      = tool:FindFirstChild("Swing")
local HitTargets = tool:FindFirstChild("HitTargets")
local Stats      = tool:FindFirstChild("Stats")
if not (hrp and Swing and HitTargets and tool.Parent == char) then return end
local maxHit = (Stats and Stats:GetAttribute("MaxHit")) or 10
local targets = {}
for _, entry in ipairs(getSortedMobs(kaTargetPriority, hrp.Position)) do
if entry.dist <= KILL_RANGE then
table.insert(targets, entry.model)
end
end
local structures = Workspace:FindFirstChild("Structures")
if structures then
local breakNames = {"Barrel","Military Box","Scrap Pile","Refined Scrap Pile"}
for _, obj in pairs(structures:GetChildren()) do
if obj:IsA("Model") and table.find(breakNames, obj.Name) then
local part = obj:FindFirstChild("HumanoidRootPart") or obj:FindFirstChildWhichIsA("BasePart")
if part and (part.Position - hrp.Position).Magnitude <= KILL_RANGE then
table.insert(targets, obj)
end
end
end
end
if #targets > 0 then
while #targets > maxHit do table.remove(targets) end
Swing:FireServer()
HitTargets:FireServer(targets)
end
end)
end
end)
end
local function watchTool(tool)
if not (tool:IsA("Tool") and tool:GetAttribute("ToolType") == "Melee") then return end
tool.Equipped:Connect(function() if killaura then startAura(tool) else activeTool = tool end end)
tool.Unequipped:Connect(function() if activeTool == tool then stopAura() end end)
if tool.Parent == player.Character then startAura(tool) end
end
local function setupKillAura()
local char    = player.Character or player.CharacterAdded:Wait()
local backpack = player:WaitForChild("Backpack")
for _, c in char:GetChildren()    do watchTool(c) end
for _, c in backpack:GetChildren() do watchTool(c) end
char.ChildAdded:Connect(watchTool)
backpack.ChildAdded:Connect(watchTool)
end
player.CharacterAdded:Connect(function() stopAura() task.wait(0.5) setupKillAura() end)
setupKillAura()
Combat:AddToggle({
Name = "Kill Aura",
Description = "Auto attack melee in range",
Callback = function(v)
killaura = v
if v and activeTool then startAura(activeTool)
elseif not v then stopAura() end
end,
})
Combat:AddDropdown({
Name     = "Kill Aura Priority",
Options  = {"Nearest", "Lowest HP", "Highest HP"},
Default  = "Nearest",
Callback = function(v) kaTargetPriority = v end,
})
Combat:AddSection("Auto Shoot")
local autoShoot     = false
local aimbotPriority = "Nearest"
local aimbotRange   = 200
local aimbotPrediction = false
local lastAutoShoot = 0
local autoShootConn = nil
local lastReplicateAim = 0
local autoShootStatus = "idle"
local function getNearestHead(fromPos)
for _, entry in ipairs(getSortedMobs(aimbotPriority, fromPos)) do
if entry.dist > aimbotRange then continue end
local head = entry.model:FindFirstChild("Head")
if head then return head end
end
return nil
end
local captureShootArgs = false
local captureAll       = false
local spyLog = {}
local spyShotCount = 0
local totalFireCalls = 0
local hookActive = false
local hookMethod = "none"
local SPY_KEYWORDS = { "shoot", "fire", "bullet", "hit", "shot", "gun", "weapon" }
local function isGunLike(remote, ...)
local nameOK, name = pcall(function() return string.lower(tostring(remote.Name)) end)
if nameOK and name then
for _, kw in ipairs(SPY_KEYWORDS) do
if string.find(name, kw, 1, true) then return true end
end
end
local arg1, arg2 = ...
if typeof(arg1) == "Vector3" and type(arg2) == "table" then
return true
end
return false
end
local function inspectValue(v, depth, seen)
depth = depth or 0
seen = seen or {}
if depth > 6 then return "<depth limit>" end
local t = typeof(v)
if t == "Vector3" then
return string.format("Vector3.new(%g, %g, %g)", v.X, v.Y, v.Z)
elseif t == "Vector2" then
return string.format("Vector2.new(%g, %g)", v.X, v.Y)
elseif t == "CFrame" then
return string.format("CFrame.new(%g, %g, %g)", v.X, v.Y, v.Z)
elseif t == "Color3" then
return string.format("Color3.new(%g, %g, %g)", v.R, v.G, v.B)
elseif t == "Instance" then
local path
local ok = pcall(function() path = v:GetFullName() end)
return string.format("<%s: %s>", v.ClassName, ok and path or v.Name)
elseif t == "table" then
if seen[v] then return "<CYCLE>" end
seen[v] = true
local indent = string.rep("  ", depth + 1)
local close  = string.rep("  ", depth)
local lines = {}
local count = 0
for k, val in pairs(v) do
count = count + 1
if count > 30 then
table.insert(lines, indent .. "...truncated...")
break
end
local kstr = type(k) == "string" and string.format("[%q]", k) or string.format("[%s]", tostring(k))
table.insert(lines, indent .. kstr .. " = " .. inspectValue(val, depth + 1, seen))
end
if #lines == 0 then return "{}" end
return "{\n" .. table.concat(lines, ",\n") .. "\n" .. close .. "}"
elseif t == "string" then
return string.format("%q", v)
elseif t == "nil" then
return "nil"
end
return tostring(v)
end
local function recordShootCall(remote, ...)
if #spyLog >= 50 then return end
spyShotCount = spyShotCount + 1
local lines = {
"==========================================",
string.format("Shot #%d  (t=%.2f)", spyShotCount, os.clock()),
"Remote: " .. inspectValue(remote),
}
local n = select("#", ...)
table.insert(lines, "Arg count: " .. n)
for i = 1, n do
local arg = (select(i, ...))
table.insert(lines, string.format("Arg %d (%s):", i, typeof(arg)))
table.insert(lines, "  " .. inspectValue(arg, 1))
end
local entry = table.concat(lines, "\n")
table.insert(spyLog, entry)
print(entry)
if type(setclipboard) == "function" then
pcall(setclipboard, table.concat(spyLog, "\n\n"))
end
end
local function spyOnNamecall(self, ...)
if not captureShootArgs then return end
if getnamecallmethod() ~= "FireServer" then return end
if typeof(self) ~= "Instance" then return end
totalFireCalls = totalFireCalls + 1
if captureAll or isGunLike(self, ...) then
recordShootCall(self, ...)
end
end
local oldNamecall
local function namecallHandler(self, ...)
pcall(spyOnNamecall, self, ...)
return oldNamecall(self, ...)
end
if type(hookmetamethod) == "function" and type(newcclosure) == "function" then
local ok = pcall(function()
oldNamecall = hookmetamethod(game, "__namecall", newcclosure(namecallHandler))
end)
if ok and oldNamecall then
hookActive = true
hookMethod = "hookmetamethod"
end
end
if not hookActive and type(getrawmetatable) == "function" and type(setreadonly) == "function" then
local ok = pcall(function()
local mt = getrawmetatable(game)
oldNamecall = mt.__namecall
setreadonly(mt, false)
mt.__namecall = namecallHandler
setreadonly(mt, true)
end)
if ok and oldNamecall then
hookActive = true
hookMethod = "getrawmetatable"
end
end
if hookActive then
print("[CRUMB HUB] namecall hook installed via " .. hookMethod)
else
warn("[CRUMB HUB] namecall hook FAILED - Spy will not work.")
end
local lastDirectFire = 0
local directFireCount = 0
local directFireGunIndex = 1  -- player has one gun in slot 1; can be tweaked if needed
local function isArsenalVisualTool(tool)
return isFakePsychicTool(tool, "Remote Arsenal") or (
tool and tool:IsA("Tool") and tool:GetAttribute("ZPsychicRemoteArsenalVisual") == true
)
end
local function isOwnedDirectGun(tool)
if not (tool and tool:IsA("Tool")) then return false end
if isPsychicToolName(tool.Name, "Remote Arsenal") then return false end
if tool:GetAttribute("ToolType") ~= "Gun" then return false end
local shoot = tool:FindFirstChild("Shoot")
local stats = tool:FindFirstChild("Stats")
if not (shoot and shoot:IsA("RemoteEvent") and stats) then return false end
if stats:GetAttribute("Projectile") then return false end
local ammo = tool:GetAttribute("Ammo")
if typeof(ammo) == "number" and ammo <= 0 then return false end
return true
end
local function getOwnedGunTools()
local guns = {}
local seen = {}
local backpack = getBackpack()
for _, container in ipairs({ player.Character, backpack }) do
if container then
for _, tool in ipairs(container:GetChildren()) do
if isOwnedDirectGun(tool) and not seen[tool] then
seen[tool] = true
table.insert(guns, tool)
end
end
end
end
return guns
end
local function getToolBarrelPosition(tool)
local recursiveBarrel = tool and tool:FindFirstChild("Barrel", true)
if recursiveBarrel then
if recursiveBarrel:IsA("Attachment") then return recursiveBarrel.WorldPosition end
if recursiveBarrel:IsA("BasePart") then return recursiveBarrel.Position end
end
local model = tool and tool:FindFirstChildOfClass("Model")
local handle = (model and model:FindFirstChild("Handle")) or (tool and tool:FindFirstChild("Handle"))
if handle then
local barrel = handle:FindFirstChild("Barrel")
if barrel then
if barrel:IsA("Attachment") then return barrel.WorldPosition end
if barrel:IsA("BasePart") then return barrel.Position end
end
if handle:IsA("BasePart") then return handle.Position end
end
local hrp = getPlayerRoot()
return hrp and hrp.Position or Vector3.new()
end
local function getStatsAttributes(stats)
if typeof(stats) == "Instance" and stats.GetAttributes then
return stats:GetAttributes()
end
return {}
end
local function getClearShotTarget(origin, head, zombie)
local direction = head.Position - origin
if direction.Magnitude <= 0 then return nil end
local params = RaycastParams.new()
params.FilterType = Enum.RaycastFilterType.Exclude
params.FilterDescendantsInstances = { player.Character }
params.IgnoreWater = true
local result = Workspace:Raycast(origin, direction, params)
if not result then
return head.Position, head
end
if result.Instance and result.Instance:IsDescendantOf(zombie) then
return result.Position, result.Instance
end
return nil
end
local function replicateAim(tool, hitPos)
local remote = tool and tool:FindFirstChild("ReplicateAim")
if not (remote and remote:IsA("RemoteEvent")) then return end
local now = os.clock()
if now - lastReplicateAim < 0.1 then return end
lastReplicateAim = now
remote:FireServer(hitPos)
end
autoShootConn = RunService.Heartbeat:Connect(function()
if not autoShoot then return end
local ok, err = pcall(function()
local now = os.clock()
local char = player.Character
local hrp  = char and char:FindFirstChild("HumanoidRootPart")
local hum  = char and char:FindFirstChildOfClass("Humanoid")
if not hrp or not hum or hum.Health <= 0 then autoShootStatus = "no character"; return end
local equipped = getEquippedTool()
local visualMode = isArsenalVisualTool(equipped)
local ownedGuns = {}
if visualMode then
for _, gun in ipairs(localBoundGuns) do
if isOwnedDirectGun(gun) then
table.insert(ownedGuns, gun)
end
end
elseif isOwnedDirectGun(equipped) then
table.insert(ownedGuns, equipped)
end
local directGun = nil
local tool = nil
if #ownedGuns > 0 then
local gunIndex = ((directFireGunIndex - 1) % #ownedGuns) + 1
directGun = ownedGuns[gunIndex]
tool = directGun
end
if not tool then
autoShootStatus = visualMode and "fake arsenal equipped; no bound guns" or "equip fake arsenal or a real gun"
return
end
local Shoot = directGun and directGun:FindFirstChild("Shoot")
if not Shoot or not Shoot:IsA("RemoteEvent") then autoShootStatus = "missing Shoot remote"; return end
local Stats = directGun and directGun:FindFirstChild("Stats")
local statAttributes = getStatsAttributes(Stats)
local fireRate = statAttributes.FireRate or (Stats and Stats:GetAttribute("FireRate")) or 600
local delay    = math.max(60 / fireRate, 0.08)
if now - lastDirectFire < delay then return end
local head = getNearestHead(hrp.Position)
if not head or not head.Parent then autoShootStatus = "no zombie target"; return end
local zombie = head.Parent
local barrelPos = getToolBarrelPosition(directGun)
local hitPos, hitPart = getClearShotTarget(barrelPos, head, zombie)
if not hitPos then autoShootStatus = "blocked line of sight"; return end
if aimbotPrediction then
hitPos = hitPos + head.AssemblyLinearVelocity * 0.1
end
local aimTool = directGun
replicateAim(aimTool, hitPos)
local pellets = statAttributes.Pellets or (Stats and Stats:GetAttribute("Pellets")) or 1
local t3 = {}
for i = 1, pellets do
t3[i] = {
Target  = hitPos,
HitData = {
{ HitChar = zombie, HitPos = hitPos, HitPart = hitPart or head },
},
}
end
lastDirectFire = now
directFireCount = directFireCount + 1
local fireIndex = 1
autoShootStatus = string.format(
"fired %s mode=%s index=%s pellets=%s target=%s",
directGun.Name,
visualMode and "fake arsenal" or "single gun",
tostring(fireIndex),
tostring(pellets),
zombie.Name
)
Shoot:FireServer(barrelPos, t3, fireIndex)
if directGun then
directFireGunIndex = (directFireGunIndex % math.max(#ownedGuns, 1)) + 1
end
end)
if not ok then
autoShootStatus = "error: " .. tostring(err)
warn("[CRUMB HUB] Auto Shoot error:", err)
end
end)
Combat:AddToggle({ Name="Auto Shoot",   Description="Auto fire zombies without moving camera or crosshair", Callback=function(v) autoShoot=v      end })
Combat:AddToggle({ Name="Prediction",   Description="Lead moving targets by velocity",                   Callback=function(v) aimbotPrediction=v end })
Combat:AddDropdown({
Name     = "Aimbot Priority",
Options  = {"Nearest", "Lowest HP", "Highest HP"},
Default  = "Nearest",
Callback = function(v) aimbotPriority = v end,
})
Combat:AddSlider({ Name="Max Range", Min=50, Max=500, Default=200, Callback=function(v) aimbotRange=v end })
Combat:AddSection("Guns")
local originalRecoil = _G.recoil
Combat:AddToggle({
Name = "No Recoil",
Description = "Zero out camera recoil",
Callback = function(v)
_G.recoil = v and function() end or originalRecoil
end,
})
Combat:AddSection("Spy")
Combat:AddToggle({
Name = "Capture Shoot Args",
Description = "Log gun-like FireServer calls (yours or external scripts)",
Callback = function(v)
captureShootArgs = v
if v then
print(string.format("[CRUMB HUB] Spy ON. Hook=%s. Fire your gun or run the other cheat.", hookMethod))
end
end,
})
Combat:AddToggle({
Name = "Capture EVERY Remote",
Description = "If gun filter misses, log ALL FireServer calls (floods)",
Callback = function(v) captureAll = v end,
})
Combat:AddButton({
Name = "Combat Diagnostic",
Description = "Copies full state to clipboard â€” paste here to debug",
Callback = function()
local char = player.Character
local tool = char and (function()
for _, t in ipairs(char:GetChildren()) do
if t:IsA("Tool") then return t end
end
end)()
local toolInfo = "(no tool)"
if tool then
local ttype = tool:GetAttribute("ToolType") or "?"
local stats = tool:FindFirstChild("Stats")
local shoot = tool:FindFirstChild("Shoot")
toolInfo = string.format("%s [ToolType=%s] Stats=%s Shoot=%s",
tool.Name, ttype,
stats and "yes" or "NO",
shoot and "yes" or "NO"
)
end
local ownedGunNames = {}
for _, gun in ipairs(getOwnedGunTools()) do
table.insert(ownedGunNames, gun.Name)
end
local ownedGunInfo = #ownedGunNames > 0 and table.concat(ownedGunNames, ", ") or "none"
local msg = string.format(
"=== CRUMB HUB COMBAT DIAGNOSTIC ===\n" ..
"-- Executor capabilities --\n" ..
"hookmetamethod: %s\n" ..
"newcclosure: %s\n" ..
"getrawmetatable: %s\n" ..
"setclipboard: %s\n" ..
"getconnections: %s\n" ..
"-- Hook state --\n" ..
"hookActive: %s (%s)\n" ..
"Spy enabled: %s   Capture all: %s\n" ..
"Total FireServer intercepted: %d\n" ..
"Captured shots in log: %d\n" ..
"-- Auto Shoot --\n" ..
"autoShoot toggle: %s\n" ..
"AutoShoot status: %s\n" ..
"Owned direct guns: %s\n" ..
"Local bound guns: %d\n" ..
"Direct fire count: %d (gunIndex=%d)\n" ..
"-- Equipped tool --\n" ..
"%s",
tostring(type(hookmetamethod) == "function"),
tostring(type(newcclosure) == "function"),
tostring(type(getrawmetatable) == "function"),
tostring(type(setclipboard) == "function"),
tostring(type(getconnections) == "function"),
tostring(hookActive), tostring(hookMethod),
tostring(captureShootArgs), tostring(captureAll),
totalFireCalls, #spyLog,
tostring(autoShoot),
tostring(autoShootStatus),
ownedGunInfo,
localBoundGunCount,
directFireCount, directFireGunIndex,
toolInfo
)
print(msg)
if type(setclipboard) == "function" then
pcall(setclipboard, msg)
end
end,
})
Combat:AddButton({
Name = "Copy Spy Log",
Description = "Copy all captured shots to clipboard",
Callback = function()
local text
if #spyLog == 0 then
text = string.format(
"(no shots captured)\nhook=%s, total intercepted=%d, spyOn=%s\n" ..
"If 'total intercepted' is 0, the executor isn't routing through our hook.",
hookMethod, totalFireCalls, tostring(captureShootArgs)
)
else
text = string.format("=== CRUMB HUB SPY: %d captures, %d total FireServer calls ===\n\n",
#spyLog, totalFireCalls) .. table.concat(spyLog, "\n\n")
end
if type(setclipboard) == "function" then
local ok = pcall(setclipboard, text)
if not ok then warn("[CRUMB HUB] setclipboard failed") end
else
warn("[CRUMB HUB] setclipboard not available on this executor")
end
print(text)
end,
})
Combat:AddButton({
Name = "Clear Spy Log",
Description = "Reset captured log and counters",
Callback = function()
spyLog = {}
spyShotCount = 0
totalFireCalls = 0
if type(setclipboard) == "function" then
pcall(setclipboard, "(cleared)")
end
end,
})
local Misc = windows:AddTab("Misc", "Misc")
Misc:AddSection("Misc")
local fullBrightConn, fpsConn, fpsV2Conn, antiAFKConn
local tickCount = 0
Misc:AddToggle({
Name = "Full Bright", Description = "Always bright",
Callback = function(state)
if state then
fullBrightConn = RunService.RenderStepped:Connect(function()
Lighting.Brightness = 5
Lighting.ClockTime = 14
Lighting.FogEnd = 1000000
Lighting.GlobalShadows = false
Lighting.OutdoorAmbient = Color3.fromRGB(255, 255, 255)
end)
else
if fullBrightConn then fullBrightConn:Disconnect() fullBrightConn = nil end
end
end,
})
Misc:AddToggle({
Name = "Remove Fog", Description = "Removes fog, minor FPS boost",
Callback = function(state)
if state then
Lighting.FogStart = 0
Lighting.FogEnd   = 1000000
local atmo = Lighting:FindFirstChildOfClass("Atmosphere")
if atmo then atmo:Destroy() end
fpsConn = RunService.RenderStepped:Connect(function()
Lighting.FogEnd = 1000000
end)
else
if fpsConn then fpsConn:Disconnect() fpsConn = nil end
end
end,
})
Misc:AddToggle({
Name = "FPS Boost", Description = "Nukes particles, shadows, decals",
Callback = function(state)
if state then
Lighting.FogEnd = 1e10
Lighting.GlobalShadows = false
local terrain = Workspace:FindFirstChildOfClass("Terrain")
if terrain then
terrain.WaterWaveSize = 0
terrain.WaterReflectance = 0
terrain.WaterTransparency = 1
end
for _, v in pairs(Workspace:GetDescendants()) do
if v:IsA("ParticleEmitter") or v:IsA("Trail") or v:IsA("Beam")
or v:IsA("Smoke") or v:IsA("Fire") or v:IsA("Sparkles")
or v:IsA("PointLight") or v:IsA("SpotLight") or v:IsA("SurfaceLight")
or v:IsA("Decal") or v:IsA("Texture") or v:IsA("SurfaceAppearance") then
v:Destroy()
elseif v:IsA("BasePart") then
v.Material = Enum.Material.SmoothPlastic
v.Reflectance = 0
v.CastShadow = false
end
end
fpsV2Conn = RunService.RenderStepped:Connect(function()
tickCount += 1
if tickCount >= 600 then
tickCount = 0
for _, v in pairs(Workspace:GetDescendants()) do
if v:IsA("ParticleEmitter") or v:IsA("Trail") or v:IsA("Beam")
or v:IsA("Smoke") or v:IsA("Fire") or v:IsA("Sparkles")
or v:IsA("PointLight") or v:IsA("SpotLight") or v:IsA("SurfaceLight") then
v:Destroy()
end
end
end
end)
else
if fpsV2Conn then fpsV2Conn:Disconnect() fpsV2Conn = nil end
end
end,
})
Misc:AddToggle({
Name = "Anti AFK", Description = "Prevents idle kick",
Callback = function(state)
if state then
antiAFKConn = player.Idled:Connect(function()
VirtualUser:Button2Down(Vector2.new(0, 0), Workspace.CurrentCamera.CFrame)
task.wait(1)
VirtualUser:Button2Up(Vector2.new(0, 0), Workspace.CurrentCamera.CFrame)
end)
else
if antiAFKConn then antiAFKConn:Disconnect() antiAFKConn = nil end
end
end,
})
repeat task.wait() until windows and windows.UI
local gui = Instance.new("ScreenGui")
gui.Parent = game:GetService("CoreGui")
local button = Instance.new("ImageButton", gui)
button.Size = UDim2.new(0, 60, 0, 60)
button.Position = UDim2.new(0.1, 0, 0.5, 0)
button.Image = "rbxassetid://102778899304981"
button.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
Instance.new("UICorner", button).CornerRadius = UDim.new(1, 0)
local stroke = Instance.new("UIStroke", button)
stroke.Thickness = 3
task.spawn(function()
local t = 0
while true do
t += 0.05
local alpha = (math.sin(t) + 1) / 2
stroke.Color = Color3.fromRGB(255*(1-alpha), 170*alpha, 255*alpha)
task.wait(0.05)
end
end)
local UIEnabled = true
button.MouseButton1Click:Connect(function()
UIEnabled = not UIEnabled
if windows and windows.UI then windows.UI.Enabled = UIEnabled end
end)
local dragging, dragInput, dragStart, startPos = false, nil, nil, nil
button.InputBegan:Connect(function(input)
if input.UserInputType == Enum.UserInputType.Touch
or input.UserInputType == Enum.UserInputType.MouseButton1 then
dragging  = true
dragStart = input.Position
startPos  = button.Position
input.Changed:Connect(function()
if input.UserInputState == Enum.UserInputState.End then dragging = false end
end)
end
end)
button.InputChanged:Connect(function(input)
if input.UserInputType == Enum.UserInputType.Touch
or input.UserInputType == Enum.UserInputType.MouseMovement then
dragInput = input
end
end)
UIS.InputChanged:Connect(function(input)
if input == dragInput and dragging then
local delta = input.Position - dragStart
button.Position = UDim2.new(
startPos.X.Scale, startPos.X.Offset + delta.X,
startPos.Y.Scale, startPos.Y.Offset + delta.Y
)
end
end)
print("RAY HUB loaded")