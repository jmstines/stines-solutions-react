import Link from "next/dist/client/link";

export default function Navbar() {
    return (
        <nav className="nav">
            <div>Test</div>
            <Link href={"/"}>
                Jeffrey Stines
            </Link>

            <ul>
                <Link href="/about">About</Link>
                <Link href="/projects">Projects</Link>
                <Link href="/contact">Contact</Link>
            </ul>
        </nav>
    )
}