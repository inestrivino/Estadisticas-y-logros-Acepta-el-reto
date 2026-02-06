export function PruebaRedis() {

    const handleClick = (): void => {
        fetch('/api/problemas')
    }

    return (
        <>
            <button onClick={handleClick}>Send</button>
        </>
    );
}