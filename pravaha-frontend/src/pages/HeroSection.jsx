import React from 'react';
import SplitText from "../components/SplitText.jsx"

const HeroSection = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full text-center pb-12">
            <SplitText
                text="Navigate the Markets with Precision."
                className="!text-4xl md:!text-6xl !font-extrabold text-center mb-2 leading-tight"
                delay={100}
                duration={1}
                ease="elastic.out(0.3, 0.3)"
                splitType="words"
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-100px"
                textAlign="center"
            />
            <SplitText
                text="Your Edge, Unveiled."
                className="!text-4xl md:!text-6xl !font-extrabold text-center mb-6 leading-tight"
                delay={100}
                duration={0.6}
                ease="power3.out"
                splitType="words"
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-100px"
                textAlign="center"
            />
            <div className="mt-2 text-lg md:text-2xl text-gray-300 font-medium italic">
                Cutting through the noise, delivering clarity.
            </div>
        </div>
    )
}

export default HeroSection;