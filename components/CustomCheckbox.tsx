import { View, Text, Image } from 'react-native'
import React from 'react'
import { images } from '@/constants'

const CustomCheckbox = ({checked, label}: {checked: boolean, label: string}) => {
    return (
        <View className="mt-2 w-full flex flex-row gap-x-3 items-start">
            <Image 
                source={checked ? images.checked : images.cocher} 
                className="h-[24] w-[24]" 
                style={{tintColor: checked ? '#169137' : '#B0B3B2'}} 
            />
            <Text 
                className={`font-medium text-[12px] flex-1 ${checked ? 'text-primary-300' : 'text-[#B0B3B2]'}`}
                numberOfLines={2}
            >
                {label}
            </Text>
        </View>
    )
}

export default CustomCheckbox;