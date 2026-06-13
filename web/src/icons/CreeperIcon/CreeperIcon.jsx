import React from 'react'

export const CreeperIcon = (props) => {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512" // Define o tamanho original do SVG
      width={props.size || "512px"}
      height={props.size || "512px"}
      fill={props.color || "currentColor"} // Permite alterar a cor via props
      {...props} // Passa outras props (como style) diretamente
    >
      <rect
        width="169.8474426"
        height="172.5011444"
      />
      <rect
        x="340.7752991"
        width="170.0938568"
        height="172.5011444"
      />
      <polygon
        points="340.7752991,172.5020294 169.8474426,172.5020294 169.8474426,258.4169006 84.78479,258.4169006 84.78479,512 169.8474426,512 169.8474426,425.3323364 340.7752991,425.3323364 340.7752991,512 426.6405334,512 426.6405334,258.4169006 340.7752991,258.4169006"
      />
    </svg>
  )
}
