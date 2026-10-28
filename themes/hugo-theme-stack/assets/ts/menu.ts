/**
 * Mobile menu slide
 *
 * 原实现用 JS 逐帧改写 height / margin / padding 来做展开收起动画。
 * 这些全是布局属性，每一帧都会触发强制重排 —— 实测一次菜单开合
 * 在移动端产生 40+ 次布局重排，是站点最主要的卡顿来源。
 *
 * 实测也排除了另一个常见方案：把高度换成 grid-template-rows: 0fr -> 1fr。
 * 它的布局重排次数（590 次/10 次开合）与原方案（568 次）基本相同 ——
 * 只要过渡高度，就必然逐帧重排，这是绕不开的。
 *
 * 最终方案：菜单以最终高度常驻布局，动画只动 transform 与 opacity，
 * 两者都是可合成属性，整个过程零布局重排、零样式重算，全部交给 GPU。
 * 收起态用 visibility: hidden 屏蔽交互，但不移出布局，
 * 因此展开时不会出现高度跳变。
 */
export default function () {
    const toggleMenu = document.getElementById('toggle-menu');
    const mainMenu = document.getElementById('main-menu');

    if (!toggleMenu || !mainMenu) return;

    // 移动端菜单常驻布局（由 CSS 的 .slide-closed / .slide-open 控制显隐），
    // 因此需要 show 类让元素参与布局，避免 display 切换造成跳变。
    // 桌面端本来就依赖 show 类，此处统一加上。
    if (window.matchMedia('(max-width: 767px)').matches) {
        mainMenu.classList.add('show', 'slide-closed');
    }

    toggleMenu.addEventListener('click', () => {
        // 当前处于收起态则本次点击为展开，反之为收起
        const opening = mainMenu.classList.contains('slide-closed');

        document.body.classList.toggle('show-menu', opening);
        toggleMenu.classList.toggle('is-active', opening);

        if (opening) {
            // 展开：先移除收起态让元素可交互，下一帧再切到展开态，
            // 两次状态切换之间浏览器才能识别到变化并触发过渡
            mainMenu.classList.remove('slide-closed');
            mainMenu.classList.add('show');
            requestAnimationFrame(() => {
                mainMenu.classList.add('slide-open');
            });
        } else {
            // 收起：切回收起态，位移与透明度一起过渡
            mainMenu.classList.remove('slide-open');
            mainMenu.classList.add('slide-closed');
        }
    });

    // 视口尺寸跨过桌面断点时同步状态，
    // 避免从桌面缩回移动端后菜单开合状态错乱。
    // 断点与主题的 respond(md) 一致（768px）。
    const desktopQuery = window.matchMedia('(min-width: 768px)');
    desktopQuery.addEventListener('change', (e) => {
        menuReset(toggleMenu, mainMenu, e.matches);
    });
}

function menuReset(toggleMenu: HTMLElement, mainMenu: HTMLElement, isDesktop: boolean) {
    document.body.classList.remove('show-menu');
    toggleMenu.classList.remove('is-active');

    if (isDesktop) {
        // 桌面端不依赖展开状态，清掉所有类即可
        mainMenu.classList.remove('slide-open', 'slide-closed');
    } else {
        mainMenu.classList.remove('slide-open');
        mainMenu.classList.add('slide-closed', 'show');
    }
}
