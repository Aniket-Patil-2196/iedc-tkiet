declare module "page-flip" {
  export interface IPageFlipSettings {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startPage?: number;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
  }

  export class PageFlip {
    constructor(element: HTMLElement, settings: IPageFlipSettings);
    loadFromHTML(items: NodeListOf<Element> | HTMLElement[]): void;
    updateFromHtml(items: NodeListOf<Element> | HTMLElement[]): void;
    turnToPrevPage(): void;
    turnToNextPage(): void;
    turnToPage(pageNum: number): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    flip(pageNum: number, corner?: "top" | "bottom"): void;
    destroy(): void;
    clear(): void;
    update(): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
    getUI(): {
      clear(): void;
      getDistElement(): HTMLElement;
      getWrapper(): HTMLElement;
    };
    on(event: string, callback: (e: any) => void): void;
    off(event: string): void;
  }
}
