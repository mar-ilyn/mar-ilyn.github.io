import { Ceiling } from './Ceiling'
import { INTRO_LAYOUT, INTRO_X, ROOM } from './layout'
import { PictureLamp } from './PictureLamp'
import { PortraitFrame } from './PortraitFrame'
import { PalaceWall } from './PalaceWall'
import { ParquetFloor } from './ParquetFloor'
import type { Quality } from './quality'

// Sala: piso de parquet, techo y pared de palacio, con el cuadro de la intro. El texto de la intro
// es HTML anclado a la pared (IntroText).
interface Props {
  quality: Quality
}

export function Room({ quality }: Props) {
  const { length, depth, height, wallZ } = ROOM
  const { frameX, frame } = INTRO_LAYOUT
  return (
    <group>
      <ParquetFloor length={length} depth={depth} quality={quality} />
      <Ceiling width={length} depth={depth} height={height} />
      <PalaceWall />

      <group position={[INTRO_X, 0, wallZ]}>
        <PortraitFrame width={frame.width} height={frame.height} position={[frameX, frame.y, 0.01]} />
        <PictureLamp x={frameX} frameTop={frame.y + frame.height / 2} frameWidth={frame.width} />
      </group>
    </group>
  )
}
