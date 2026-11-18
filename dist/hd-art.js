// Keep rule data in the base manifest. The presentation catalog supplies artwork.
export function useHdArt(base,art){
  const vehicles=Object.fromEntries(Object.entries(base.vehicles).map(([id,model])=>[id,{...model,...art.vehicles[id]}]));
  const starters=Object.fromEntries(Object.entries(base.starters).map(([id,model])=>[id,{...model,...art.starters[id]}]));
  return {...base,vehicles,starters,characters:art.characters,portraits:art.portraits,
    worlds:{...base.worlds,...art.worlds},hd2d:true};
}
